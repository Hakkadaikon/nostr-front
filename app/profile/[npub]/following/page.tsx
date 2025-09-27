import { FollowList } from '../../../../components/profile/FollowList';

interface FollowingPageProps {
  params: Promise<{ npub: string }>;
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { npub } = await params;

  return <FollowList npub={npub} type="following" />;
}