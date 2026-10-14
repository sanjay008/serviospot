import { router, usePathname, type Href } from 'expo-router';
import { useState } from 'react';

import { ConfirmModal } from '@/components/ConfirmModal';
import { useApp } from '@/state/store';

/**
 * Guests can browse freely. Actions that reach a vendor call `requireLogin`, which runs them for a
 * signed-in user and otherwise shows the login popup. Render `gate` once in the screen.
 */
export function useLoginGate() {
  const { session } = useApp();
  const here = usePathname();
  const [next, setNext] = useState<string | null>(null);

  const requireLogin = (target: string, run: () => void = () => router.push(target as Href)) => {
    if (session.signedIn) run();
    else setNext(target);
  };

  const gate = (
    <ConfirmModal
      visible={next !== null}
      icon="lock"
      title="Login required"
      body="Log in or create an account to ask vendors for a price. Browsing stays free."
      confirmLabel="Log in"
      cancelLabel="Not now"
      onConfirm={() => {
        const target = next ?? here;
        setNext(null);
        router.push(`/login?from=${encodeURIComponent(here)}&next=${encodeURIComponent(target)}` as Href);
      }}
      onClose={() => setNext(null)}
    />
  );

  return { requireLogin, gate };
}

/** After a login that started from the popup: close the login screens, then open what the user asked for. */
export function continueAfterLogin(from: string | undefined, next: string | undefined) {
  if (!from) return false;
  router.dismissTo(from as Href);
  if (next && next !== from) router.push(next as Href);
  return true;
}
