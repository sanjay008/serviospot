import { useState } from 'react';

import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ToggleRow } from '@/components/ListRow';
import { prepareNotifications } from '@/notifications/push';
import { useNotifySettingsSync } from '@/state/apiSync';
import { useApp } from '@/state/store';

export default function NotificationSettings() {
  const { notify, setNotify } = useApp();
  useNotifySettingsSync();
  const [error, setError] = useState('');
  return (
    <Screen header={<Header title="Notifications" back />}>
      {error ? <Notice tone="error" body={error} /> : null}
      <Notice tone="info" body="Push asks for the phone’s permission and shows an alert when a request, proposal or review happens in the app. Email still is not sent. Alerts from the server, while the app is closed, need Firebase on Android and an Apple push key on iOS." />
      <ToggleRow
        title="Push notifications"
        value={notify.push}
        onChange={(push) => {
          void setNotify({ push }).then((result) => {
            setError(result.ok ? '' : result.reason);
            if (result.ok && push) void prepareNotifications();
          });
        }}
      />
      <ToggleRow title="Email for important updates" value={notify.email} onChange={(email) => void setNotify({ email }).then((result) => setError(result.ok ? '' : result.reason))} />
      <ToggleRow title="Requests and leads" value={notify.requests} onChange={(requests) => void setNotify({ requests }).then((result) => setError(result.ok ? '' : result.reason))} />
      <ToggleRow title="Messages" value={notify.messages} onChange={(messages) => void setNotify({ messages }).then((result) => setError(result.ok ? '' : result.reason))} />
      <ToggleRow title="Proposals" value={notify.proposals} onChange={(proposals) => void setNotify({ proposals }).then((result) => setError(result.ok ? '' : result.reason))} />
      <ToggleRow title="Reviews" value={notify.reviews} onChange={(reviews) => void setNotify({ reviews }).then((result) => setError(result.ok ? '' : result.reason))} />
    </Screen>
  );
}
