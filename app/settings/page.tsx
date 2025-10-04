'use client';

import RelayManager from '../../components/relays/RelayManager';
import KeyManager from '../../components/keys/KeyManager';
import { NotificationSettings } from '../../components/settings/NotificationSettings';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>

        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{t('settings.notificationSection')}</h2>
            <NotificationSettings />
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{t('settings.relaySection')}</h2>
            <RelayManager />
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{t('settings.keyManagement')}</h2>
            <KeyManager />
          </section>
        </div>
      </div>
    </div>
  );
}
