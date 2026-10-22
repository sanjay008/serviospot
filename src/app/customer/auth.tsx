import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextInputProps } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';

import { COMPANY_LOGIN, setAuthToken, useCompanyLoginMutation, useLoginNewMutation, useResendOtpMutation, useVerifyOtpNewMutation, type ApiFailure, type OtpStartReply, type OtpVerifyReply } from '@/api';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { Button } from '@/flow2/components/Button';
import { Card } from '@/flow2/components/Card';
import { Input } from '@/flow2/components/Input';
import { Notice } from '@/flow2/components/Notice';
import { Screen } from '@/flow2/components/Screen';
import { palette } from '@/flow2/constants/theme';
import { useApp as useFlowApp } from '@/flow2/state/app';
import { useApp as useSessionApp } from '@/state/store';

type AuthRole = 'customer' | 'vendor';
type IdentityMethod = 'whatsapp' | 'email';
type PendingOtp = {
  userId: string | number;
  verifyToken: string;
  otpType: string;
  role: AuthRole;
  identity: string;
  method: IdentityMethod;
  emailRequired?: boolean;
  vendorProfileComplete?: boolean;
  profileComplete?: boolean;
};
const OTP_CELL_COUNT = 6;
const OTP_AUTOCOMPLETE = Platform.select<TextInputProps['autoComplete']>({ android: 'sms-otp', default: 'one-time-code' });

function errorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiFailure | undefined;
  return apiError?.message || fallback;
}

function userRecord(reply: OtpVerifyReply) {
  return reply.user && typeof reply.user === 'object' ? reply.user : {};
}

function flag(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  return undefined;
}

export default function CustomerAuthScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const { role: selectedRole, setRole, setCustomerAccount, patchOnboarding } = useFlowApp();
  const role: AuthRole = params.role === 'vendor' ? 'vendor' : params.role === 'customer' ? 'customer' : selectedRole;
  const { startSession, hydrate } = useSessionApp();
  const [method, setMethod] = useState<IdentityMethod>('whatsapp');
  const [countryCode, setCountryCode] = useState('31');
  const [countryName, setCountryName] = useState('Netherlands');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState<PendingOtp | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resends, setResends] = useState(0);
  const otpRef = useBlurOnFulfill({ value: otp, cellCount: OTP_CELL_COUNT });
  const [otpFieldProps, getCellOnLayoutHandler] = useClearByFocusCell({ value: otp, setValue: setOtp });
  const [companyLogin, { isLoading: connecting }] = useCompanyLoginMutation();
  const [loginNew, { isLoading: starting }] = useLoginNewMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpNewMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((remaining) => remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const roleTitle = role === 'vendor' ? 'Vendor' : 'Customer';
  const phoneDigits = useMemo(() => phone.replace(/\D/g, '').replace(/^0(?=\d)/, ''), [phone]);

  const start = async () => {
    setError('');
    setNotice('');
    const cleanEmail = email.trim().toLowerCase();
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (method === 'whatsapp' && (phoneDigits.length < 6 || phoneDigits.length > 15)) {
      setError('Enter a valid WhatsApp number.');
      return;
    }

    try {
      await companyLogin({ company_login: COMPANY_LOGIN }).unwrap();
      const reply: OtpStartReply = await loginNew({
        company_login: COMPANY_LOGIN,
        role,
        ...(method === 'email' ? { email: cleanEmail } : { country_code: countryCode, whatsapp_number: phoneDigits }),
      }).unwrap();
      const user = reply.user;
      if (!user?.id || !user.verify_token || !reply.type) throw new Error('The server reply was missing OTP details. Please try again.');
      const identity = method === 'email' ? cleanEmail : `+${countryCode} ${phoneDigits}`;
      setPending({
        userId: user.id,
        verifyToken: user.verify_token,
        otpType: reply.type,
        role,
        identity,
        method,
        emailRequired: flag(reply.email_required),
        vendorProfileComplete: flag(reply.vendor_profile_complete),
        profileComplete: flag(reply.profile_complete),
      });
      setOtp('');
      setSecondsLeft(30);
      setResends(1);
      setNotice(reply.type === 'user_register_requests'
        ? 'OTP sent. Enter the code to create your account.'
        : 'OTP sent. Enter the code to log in.');
    } catch (failure) {
      setError(errorMessage(failure, 'Could not send a code. Please try again.'));
    }
  };

  const verify = async () => {
    if (!pending) return;
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }
    try {
      const reply = await verifyOtp({
        token: pending.verifyToken,
        user_id: pending.userId,
        otp,
        otp_type: pending.otpType,
        role: pending.role,
      }).unwrap();
      const user = userRecord(reply);
      const verifiedRole = user.role === 'vendor' ? 'vendor' : user.role === 'customer' ? 'customer' : pending.role;
      if (verifiedRole !== pending.role) throw new Error('The account role did not match the selected button. Please use the correct role.');
      const sessionToken = typeof user.verify_token === 'string' ? user.verify_token : '';
      if (!sessionToken) throw new Error('The server reply was missing a session token. Please try again.');
      await setAuthToken(sessionToken);

      const emailRequired = flag(reply.email_required) ?? flag(user.email_required) ?? pending.emailRequired ?? false;
      const vendorProfileComplete = flag(reply.vendor_profile_complete) ?? pending.vendorProfileComplete ?? false;
      const profileComplete = flag(reply.profile_complete) ?? pending.profileComplete;
      const fullName = [user.full_name, user.name, user.first_name].find((value) => typeof value === 'string' && value.trim()) as string | undefined;
      const accountEmail = emailRequired ? '' : typeof user.email === 'string' && user.email.trim() ? user.email.trim() : pending.method === 'email' ? pending.identity : '';
      const accountPhone = typeof user.whatsapp_number === 'string' && user.whatsapp_number.trim()
        ? `+${typeof user.country_code === 'string' ? user.country_code : countryCode} ${user.whatsapp_number}`
        : typeof user.phone === 'string' && user.phone.trim() ? user.phone : pending.method === 'whatsapp' ? pending.identity : '';
      const displayName = fullName?.trim() ?? '';

      setRole(verifiedRole);
      setCustomerAccount({ name: displayName, email: accountEmail, phone: accountPhone, emailRequired });
      const destination = startSession({
        name: displayName || accountEmail || accountPhone,
        email: accountEmail,
        phone: accountPhone,
        mode: verifiedRole === 'vendor' ? 'provider' : 'customer',
        hasProviderProfile: verifiedRole === 'vendor' && vendorProfileComplete,
      });
      hydrate({ session: { authResponse: reply as Record<string, unknown> } });
      if (verifiedRole === 'vendor') {
        if (!vendorProfileComplete) {
          patchOnboarding({
            name: displayName,
            email: accountEmail,
            emailRequired,
            phone: accountPhone,
            password: '',
            accountCreated: true,
            emailVerified: !emailRequired,
            phoneVerified: true,
            profileName: displayName,
          });
          router.replace('/vendor' as never);
        } else {
          router.replace(destination as never);
        }
      } else if (emailRequired || profileComplete === false || !displayName) {
        router.replace('/customer/profile-edit?required=1' as never);
      } else {
        router.replace(destination as never);
      }
    } catch (failure) {
      setError(errorMessage(failure, 'That code could not be verified. Check it and try again.'));
    }
  };

  const resend = async () => {
    if (!pending || secondsLeft > 0 || resending) return;
    setError('');
    try {
      await resendOtp({ company_login: COMPANY_LOGIN, user_id: pending.userId, otp_type: pending.otpType }).unwrap();
      setResends((count) => count + 1);
      setSecondsLeft(30);
      setNotice('A new code was sent.');
    } catch (failure) {
      setError(errorMessage(failure, 'Could not resend the code. Please try again.'));
    }
  };

  const changeMethod = (next: IdentityMethod) => {
    setMethod(next);
    setError('');
    setNotice('');
  };

  return (
    <Screen>
      <View style={styles.intro}>
        <Text style={styles.title}>{pending ? 'Enter your code' : `Login / Register as ${roleTitle}`}</Text>
        <Text style={styles.subtitle}>{pending ? `We sent a code to ${pending.identity}.` : 'Use WhatsApp or email. We’ll send a code to log in or create your account.'}</Text>
      </View>

      <Card style={styles.form}>
        {pending ? (
          <>
            <View style={styles.otpField}>
              <Text style={styles.fieldLabel}>6-digit code</Text>
              <CodeField
                ref={otpRef}
                {...otpFieldProps}
                value={otp}
                onChangeText={(value) => { setOtp(value.replace(/\D/g, '').slice(0, OTP_CELL_COUNT)); setError(''); }}
                cellCount={OTP_CELL_COUNT}
                rootStyle={styles.otpCells}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete={OTP_AUTOCOMPLETE}
                autoFocus
                renderCell={({ index, symbol, isFocused }) => (
                  <Text key={index} onLayout={getCellOnLayoutHandler(index)} style={[styles.otpCell, isFocused && styles.otpCellFocused]}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                )}
              />
            </View>
            {notice ? <Notice tone="info" body={notice} /> : null}
            {error ? <Notice tone="error" body={error} /> : null}
            <Button label="Verify code" onPress={verify} loading={verifying} style={styles.submit} />
            <View style={styles.resendRow}>
              <Text style={styles.switchText}>{secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : resends >= 3 ? 'Resend limit reached. Try again later.' : "Didn't receive a code?"}</Text>
              {secondsLeft === 0 && resends < 3 ? <Pressable accessibilityRole="button" disabled={resending} onPress={() => void resend()}><Text style={styles.switchAction}>{resending ? 'Sending…' : 'Resend code'}</Text></Pressable> : null}
            </View>
            <Pressable accessibilityRole="button" onPress={() => { setPending(null); setNotice(''); setError(''); setOtp(''); }} style={styles.backLink}>
              <Text style={styles.switchAction}>Change login details</Text>
            </Pressable>
          </>
        ) : (
          <>
            {method === 'whatsapp' ? (
              <View style={styles.phoneField}>
                <Text style={styles.fieldLabel}>WhatsApp number</Text>
                <View style={styles.phoneRow}>
                  <CountryCodePicker value={countryCode} countryName={countryName} onChange={(code, name) => { setCountryCode(code); setCountryName(name); setError(''); }} />
                  <View style={styles.phoneInput}>
                    <Input value={phone} onChangeText={(value) => { setPhone(value); setError(''); }} placeholder="6 1234 5678" keyboardType="phone-pad" autoCapitalize="none" />
                  </View>
                </View>
              </View>
            ) : (
              <Input label="Email address" value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            )}
            {error ? <Notice tone="error" body={error} /> : null}
            <Button label="Send code" onPress={() => void start()} loading={connecting || starting} style={styles.submit} />
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>{method === 'whatsapp' ? 'Prefer email?' : 'Prefer WhatsApp?'}</Text>
              <Pressable accessibilityRole="button" onPress={() => changeMethod(method === 'whatsapp' ? 'email' : 'whatsapp')}>
                <Text style={styles.switchAction}>{method === 'whatsapp' ? 'Login with email' : 'Login with WhatsApp'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 7, marginTop: 22, marginBottom: 8, alignItems: 'center' },
  title: { color: palette.ink, fontSize: 25, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 360 },
  form: { gap: 14, padding: 18 },
  otpField: { gap: 8 },
  otpCells: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  otpCell: { flex: 1, minWidth: 0, maxWidth: 48, height: 54, borderRadius: 11, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, color: palette.ink, fontSize: 22, fontWeight: '700', lineHeight: 52, textAlign: 'center', overflow: 'hidden' },
  otpCellFocused: { borderColor: palette.accent, borderWidth: 2 },
  phoneField: { gap: 6 },
  fieldLabel: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  phoneInput: { flex: 1 },
  submit: { marginTop: 2, minHeight: 52 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  switchText: { color: palette.muted, fontSize: 14, textAlign: 'center' },
  switchAction: { color: palette.accentDark, fontSize: 14, fontWeight: '800' },
  backLink: { alignSelf: 'center', padding: 6 },
});
