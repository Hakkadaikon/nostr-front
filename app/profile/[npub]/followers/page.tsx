import { FollowList } from '../../../../components/profile/FollowList';

interface FollowersPageProps {
  params: Promise<{ npub: string }>;
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { npub } = await params;
  
  return <FollowList npub={npub} type="followers" />;
}