import RelayManager from '../../components/relays/RelayManager';
import KeyManager from '../../components/keys/KeyManager';
import { NotificationSettings } from '../../components/settings/NotificationSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-2">通知</h2>
        <NotificationSettings />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Relays</h2>
        <RelayManager />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Keys</h2>
        <KeyManager />
      </section>
    </div>
  );
}
