import ProfileEditor from '../../../components/profile/ProfileEditor';

type Props = { params: { npub: string } };

export default function ProfilePage({ params }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <div className="text-sm text-gray-600 dark:text-gray-300">npub: <code>{params.npub}</code></div>
      <ProfileEditor />
    </div>
  );
}
