import RelayManager from '../../components/relays/RelayManager';
import KeyManager from '../../components/keys/KeyManager';
import { NotificationSettings } from '../../components/settings/NotificationSettings';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">設定</h1>
        
        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">通知</h2>
            <NotificationSettings />
          </section>
          
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">リレー</h2>
            <RelayManager />
          </section>
          
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">鍵管理</h2>
            <KeyManager />
          </section>
        </div>
      </div>
    </div>
  );
}
