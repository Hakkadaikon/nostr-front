'use client';

import RelayManager from '../../components/relays/RelayManager';
import KeyManager from '../../components/keys/KeyManager';
import { NotificationSettings } from '../../components/settings/NotificationSettings';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('settings.title')}</h1>

          <div className="space-y-6 sm:space-y-8">
            <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{t('settings.notificationSection')}</h2>
              <NotificationSettings />
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{t('settings.relaySection')}</h2>
              <RelayManager />
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{t('settings.keyManagement')}</h2>
              <KeyManager />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
