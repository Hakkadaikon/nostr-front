"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { ProfileTabs, ProfileTab } from '../../../components/profile/ProfileTabs';
import { ProfileEditModal } from '../../../components/profile/ProfileEditModal';
import { TimelineList } from '../../../components/timeline/TimelineList';
import { Spinner } from '../../../components/ui/Spinner';
import { ProfileSidebar } from '../../../components/profile/ProfileSidebar';
import { Profile } from '../../../features/profile/types';
import { fetchProfile } from '../../../features/profile/fetchProfile';
import { fetchUserPosts } from '../../../features/profile/fetchUserPosts';
import { followUser, unfollowUser, isFollowing as checkFollowStatus } from '../../../features/profile/follow';
import { useProfileStore } from '../../../stores/profile.store';
import { useAuthStore } from '../../../stores/auth.store';
import { Tweet } from '../../../features/timeline/types';
import { likeTweet, unlikeTweet, retweet, undoRetweet } from '../../../features/timeline/services/timeline';

type Props = { params: { npub: string } };

export default function ProfilePage({ params }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  
  const { current: currentUser } = useProfileStore();
  const { publicKey } = useAuthStore();
  const isOwnProfile = currentUser?.npub === params.npub;

  // プロフィール情報の取得
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await fetchProfile(params.npub);
        setProfile({
          npub: params.npub,
          name: profileData.name,
          displayName: profileData.display_name,
          about: profileData.about,
          picture: profileData.picture,
          banner: profileData.banner,
          website: profileData.website,
          lud16: profileData.lud16,
          nip05: profileData.nip05,
          followersCount: 0, // TODO: 実装
          followingCount: 0, // TODO: 実装
          postsCount: 0, // TODO: 実装
        });
        
        // フォロー状態を確認
        if (!isOwnProfile && publicKey) {
          const status = await checkFollowStatus(params.npub);
          setIsFollowing(status);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [params.npub, isOwnProfile, publicKey]);

  // ユーザーの投稿を取得
  useEffect(() => {
    const loadTweets = async () => {
      setTweetsLoading(true);
      try {
        const userPosts = await fetchUserPosts(params.npub);
        
        // プロフィール情報でauthor情報を更新
        if (profile && userPosts.length > 0) {
          const updatedPosts = userPosts.map(post => ({
            ...post,
            author: {
              ...post.author,
              name: profile.displayName || profile.name || post.author.name,
              username: profile.name || post.author.username,
              avatar: profile.picture || post.author.avatar,
              bio: profile.about || post.author.bio
            }
          }));
          setTweets(updatedPosts);
        } else {
          setTweets(userPosts);
        }
      } catch (error) {
        console.error('Failed to load tweets:', error);
      } finally {
        setTweetsLoading(false);
      }
    };
    
    if (activeTab === 'posts') {
      loadTweets();
    }
  }, [profile, activeTab, params.npub]);

  const handleFollow = async () => {
    if (!publicKey) {
      router.push('/onboarding');
      return;
    }
    
    try {
      // 楽観的更新
      setIsFollowing(!isFollowing);
      
      if (isFollowing) {
        await unfollowUser(params.npub);
      } else {
        await followUser(params.npub);
      }
    } catch (error) {
      // エラー時は元に戻す
      setIsFollowing(isFollowing);
      console.error('Failed to follow/unfollow:', error);
      // TODO: エラートーストを表示
    }
  };

  const handleProfileSave = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    if (isOwnProfile) {
      useProfileStore.getState().setCurrent(updatedProfile);
    }
  };

  const handleLike = async (tweetId: string) => {
    const tweet = tweets.find(t => t.id === tweetId);
    if (!tweet) return;
    
    try {
      // 楽観的更新
      setTweets(tweets.map(t => {
        if (t.id === tweetId) {
          return {
            ...t,
            isLiked: !t.isLiked,
            likesCount: t.isLiked ? t.likesCount - 1 : t.likesCount + 1
          };
        }
        return t;
      }));
      
      if (tweet.isLiked) {
        await unlikeTweet(tweetId);
      } else {
        await likeTweet(tweetId);
      }
    } catch (error) {
      // エラー時は元に戻す
      setTweets(tweets.map(t => {
        if (t.id === tweetId) {
          return {
            ...t,
            isLiked: tweet.isLiked,
            likesCount: tweet.likesCount
          };
        }
        return t;
      }));
      console.error('Failed to toggle like:', error);
    }
  };

  const handleRetweet = async (tweetId: string) => {
    const tweet = tweets.find(t => t.id === tweetId);
    if (!tweet) return;
    
    try {
      // 楽観的更新
      setTweets(tweets.map(t => {
        if (t.id === tweetId) {
          return {
            ...t,
            isRetweeted: !t.isRetweeted,
            retweetsCount: t.isRetweeted ? t.retweetsCount - 1 : t.retweetsCount + 1
          };
        }
        return t;
      }));
      
      if (tweet.isRetweeted) {
        await undoRetweet(tweetId);
      } else {
        await retweet(tweetId);
      }
    } catch (error) {
      // エラー時は元に戻す
      setTweets(tweets.map(t => {
        if (t.id === tweetId) {
          return {
            ...t,
            isRetweeted: tweet.isRetweeted,
            retweetsCount: tweet.retweetsCount
          };
        }
        return t;
      }));
      console.error('Failed to toggle retweet:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">プロフィールが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/80 pb-16 dark:bg-black">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setIsEditModalOpen(true)}
        onFollowClick={handleFollow}
        isFollowing={isFollowing}
      />

      <main className="mx-auto mt-10 w-full max-w-6xl px-4">
        <div className="space-y-6">
          <ProfileSidebar profile={profile} />

          <section className="space-y-4">
            <div className="sticky top-16 z-10 -mx-4 bg-gray-100/95 backdrop-blur-sm dark:bg-black/95">
              <ProfileTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{ posts: profile.postsCount ?? tweets.length }}
              />
            </div>

            <div>
              {activeTab === 'posts' && (
                <TimelineList
                  tweets={tweets}
                  isLoading={tweetsLoading}
                  onLike={handleLike}
                  onRetweet={handleRetweet}
                />
              )}

              {activeTab === 'replies' && (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  返信はまだありません
                </div>
              )}

              {activeTab === 'media' && (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  メディアはまだありません
                </div>
              )}

              {activeTab === 'likes' && (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  いいねした投稿はまだありません
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {isOwnProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentProfile={profile}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
}
