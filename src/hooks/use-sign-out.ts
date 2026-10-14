import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useDeleteAccountMutation, useLogoutMutation, type ApiFailure } from '@/api';
import { useApp } from '@/state/store';

function messageOf(failure: unknown, fallback: string) {
  const message = (failure as Partial<ApiFailure> | undefined)?.message;
  return typeof message === 'string' && message ? message : fallback;
}

/** Logout and delete wait for the API. The session stays on this phone when the call fails. */
export function useSignOut() {
  const { signOut } = useApp();
  const [logoutCall, logout] = useLogoutMutation();
  const [deleteCall, removal] = useDeleteAccountMutation();

  const leave = () => {
    signOut();
    router.replace('/role');
  };

  // `close` hides the confirm modal first, so the alert is not dismissed together with it on iOS.
  const logOut = async (close: () => void) => {
    try {
      await logoutCall().unwrap();
      close();
      leave();
    } catch (failure) {
      close();
      setTimeout(() => Alert.alert('Could not log out', messageOf(failure, 'Something went wrong. Try again.')), 300);
    }
  };

  const deleteAccount = async (close: () => void) => {
    try {
      await deleteCall().unwrap();
      close();
      leave();
    } catch (failure) {
      close();
      setTimeout(() => Alert.alert('Could not delete account', messageOf(failure, 'Something went wrong. Try again.')), 300);
    }
  };

  return { logOut, deleteAccount, loggingOut: logout.isLoading, deleting: removal.isLoading };
}
