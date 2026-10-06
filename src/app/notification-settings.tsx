import { Header } from '@/components/Header';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ToggleRow } from '@/components/ListRow';
import { useApp } from '@/state/store';

export default function NotificationSettings() {
  const { notify, setNotify } = useApp();
  return (
    <Screen header={<Header title="Notifications" back />}>
      <Notice tone="info" body="Push and email are preferences only in this preview. Nothing is sent to a server." />
      <ToggleRow title="Push notifications" value={notify.push} onChange={(push) => setNotify({ push })} />
      <ToggleRow title="Email for important updates" value={notify.email} onChange={(email) => setNotify({ email })} />
      <ToggleRow title="Requests and leads" value={notify.requests} onChange={(requests) => setNotify({ requests })} />
      <ToggleRow title="Messages" value={notify.messages} onChange={(messages) => setNotify({ messages })} />
      <ToggleRow title="Proposals" value={notify.proposals} onChange={(proposals) => setNotify({ proposals })} />
      <ToggleRow title="Reviews" value={notify.reviews} onChange={(reviews) => setNotify({ reviews })} />
    </Screen>
  );
}
