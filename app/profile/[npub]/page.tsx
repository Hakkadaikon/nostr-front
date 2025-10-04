"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { fetchUserReplies } from '../../../features/profile/fetchUserReplies';
import { fetchUserMedia } from '../../../features/profile/fetchUserMedia';
import { fetchUserLikes } from '../../../features/profile/fetchUserLikes';
import { followUser, unfollowUser, isFollowing as checkFollowStatus } from '../../../features/profile/follow';
import { useProfileStore } from '../../../stores/profile.store';
import { useAuthStore } from '../../../stores/auth.store';
import { Tweet } from '../../../features/timeline/types';
import { getProfileImageUrl } from '../../../lib/utils/avatar';
import { nip19 } from 'nostr-tools';
import { likeTweet, unlikeTweet, retweet, undoRetweet } from '../../../features/timeline/services/timeline';
import { decode } from '../../../lib/nostr/nip19';
import { fetchProfileStats } from '../../../features/profile/services/profileStats';
import { useTranslation } from 'react-i18next';

type Props = { params: { npub: string } };

export default function ProfilePage({ params }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [replies, setReplies] = useState<Tweet[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [mediaPosts, setMediaPosts] = useState<Tweet[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Tweet[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [followingCount, setFollowingCount] = useState<number | null>(0);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [isLoadingFollowingCount, setIsLoadingFollowingCount] = useState(false);
  const [isLoadingFollowerCount, setIsLoadingFollowerCount] = useState(false);
  const [hasLoadedFollowingCount, setHasLoadedFollowingCount] = useState(false);
  const [hasLoadedFollowerCount, setHasLoadedFollowerCount] = useState(false);
  
  const { current: currentUser } = useProfileStore();
  const { publicKey } = useAuthStore();
  const isOwnProfile = currentUser?.npub === params.npub;

  let pubkey: string | undefined;
  try {
    if (params.npub && !Array.isArray(params.npub)) {
      const decoded = decode(params.npub);
      pubkey = decoded.data as string;
    }
  } catch (err) {
    console.error('Failed to decode npub:', err);
    pubkey = undefined;
  }

  // プロフィール情報の取得
  useEffect(() => {
    const loadProfile = async () => {
      if (!params.npub || !pubkey) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // npubでもhexでも対応できるようにする
        const profileData = await fetchProfile(params.npub);
        
        // npubからpubkeyを取得
        let pubkey = '';
        try {
          const decoded = nip19.decode(params.npub);
          if (decoded.type === 'npub') {
            pubkey = decoded.data as string;
          }
        } catch (error) {
          console.error('Failed to decode npub:', error);
          // npubのデコードに失敗した場合はnpubをそのまま使用
          pubkey = params.npub;
        }
        
        // プロフィールデータが空の場合のデフォルト値を設定
        const defaultName = params.npub.slice(0, 8) + '...';
        
        setProfile({
          npub: params.npub,
          name: profileData.name || defaultName,
          displayName: profileData.display_name || profileData.name || defaultName,
          about: profileData.about || '',
          picture: getProfileImageUrl(profileData.picture, pubkey), // 統一されたアバター生成
          banner: profileData.banner || '',
          website: profileData.website || '',
          lud16: profileData.lud16 || '',
          nip05: profileData.nip05 || '',
        });
        
        // フォロー状態を確認
        if (!isOwnProfile && publicKey) {
          const status = await checkFollowStatus(params.npub);
          setIsFollowing(status);
        }

        // フォロー数は初期表示時に取得、フォロワー数はクリック時に取得
        if (pubkey && !hasLoadedFollowingCount && !isLoadingFollowingCount) {
          setIsLoadingFollowingCount(true);
          fetchProfileStats(pubkey).then(stats => {
            setFollowingCount(stats.followingCount);
            setHasLoadedFollowingCount(true);
          }).catch(error => {
            console.error('Failed to load following count:', error);
            setFollowingCount(0);
          }).finally(() => {
            setIsLoadingFollowingCount(false);
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        // エラー時にもデフォルト値を設定
        const defaultName = params.npub.slice(0, 8) + '...';
        
        // npubからpubkeyを取得（エラー時も）
        let pubkey = '';
        try {
          const decoded = nip19.decode(params.npub);
          if (decoded.type === 'npub') {
            pubkey = decoded.data as string;
          }
        } catch {
          pubkey = params.npub;
        }
        
        setProfile({
          npub: params.npub,
          name: defaultName,
          displayName: defaultName,
          about: '',
          picture: getProfileImageUrl(null, pubkey), // 統一されたアバター生成
          banner: '',
          website: '',
          lud16: '',
          nip05: '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.npub, isOwnProfile, publicKey, pubkey]);

  // タブに応じたデータを取得
  useEffect(() => {
    const updateAuthorInfo = (posts: Tweet[]) => {
      if (profile && posts.length > 0) {
        return posts.map(post => ({
          ...post,
          author: {
            ...post.author,
            name: profile.displayName || profile.name || post.author.name,
            username: profile.name || post.author.username,
            avatar: profile.picture || post.author.avatar,
            bio: profile.about || post.author.bio
          }
        }));
      }
      return posts;
    };

    const loadTweets = async () => {
      setTweetsLoading(true);
      try {
        const userPosts = await fetchUserPosts(params.npub);
        setTweets(updateAuthorInfo(userPosts));
      } catch (error) {
        console.error('Failed to load tweets:', error);
      } finally {
        setTweetsLoading(false);
      }
    };

    const loadReplies = async () => {
      setRepliesLoading(true);
      try {
        const userReplies = await fetchUserReplies(params.npub);
        setReplies(updateAuthorInfo(userReplies));
      } catch (error) {
        console.error('Failed to load replies:', error);
      } finally {
        setRepliesLoading(false);
      }
    };

    const loadMedia = async () => {
      setMediaLoading(true);
      try {
        const userMedia = await fetchUserMedia(params.npub);
        setMediaPosts(updateAuthorInfo(userMedia));
      } catch (error) {
        console.error('Failed to load media posts:', error);
      } finally {
        setMediaLoading(false);
      }
    };

    const loadLikes = async () => {
      setLikesLoading(true);
      try {
        const userLikes = await fetchUserLikes(params.npub);
        setLikedPosts(userLikes); // いいねした投稿は他のユーザーの投稿なので author 情報は更新しない
      } catch (error) {
        console.error('Failed to load liked posts:', error);
      } finally {
        setLikesLoading(false);
      }
    };

    switch (activeTab) {
      case 'posts':
        loadTweets();
        break;
      case 'replies':
        loadReplies();
        break;
      case 'media':
        loadMedia();
        break;
      case 'likes':
        loadLikes();
        break;
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
    // 現在のタブに応じて適切なデータセットを取得
    const getCurrentTweets = () => {
      switch (activeTab) {
        case 'posts': return tweets;
        case 'replies': return replies;
        case 'media': return mediaPosts;
        case 'likes': return likedPosts;
        default: return tweets;
      }
    };

    const setCurrentTweets = (newTweets: Tweet[]) => {
      switch (activeTab) {
        case 'posts': setTweets(newTweets); break;
        case 'replies': setReplies(newTweets); break;
        case 'media': setMediaPosts(newTweets); break;
        case 'likes': setLikedPosts(newTweets); break;
      }
    };

    const currentTweets = getCurrentTweets();
    const tweet = currentTweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 認証チェック
    if (!publicKey) {
      console.warn('Cannot like: User is not authenticated');
      return;
    }

    try {
      // 楽観的更新
      setCurrentTweets(currentTweets.map(t => {
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
        await likeTweet(tweetId, tweet.author.id);
      }
    } catch (error) {
      // エラー時は元に戻す
      setCurrentTweets(currentTweets.map(t => {
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

  const loadFollowingCount = useCallback(async (targetPubkey: string) => {
    if (isLoadingFollowingCount || hasLoadedFollowingCount) return;

    setIsLoadingFollowingCount(true);
    try {
      const stats = await fetchProfileStats(targetPubkey);
      setFollowingCount(stats.followingCount);
      setHasLoadedFollowingCount(true);
    } catch (error) {
      console.error('Failed to load following count:', error);
      setFollowingCount(0);
    } finally {
      setIsLoadingFollowingCount(false);
    }
  }, [isLoadingFollowingCount, hasLoadedFollowingCount]);

  const handleLoadFollowingCount = async () => {
    if (!pubkey) return;
    await loadFollowingCount(pubkey);
  };

  const handleLoadFollowerCount = async () => {
    if (isLoadingFollowerCount || hasLoadedFollowerCount || !pubkey) return;

    setIsLoadingFollowerCount(true);
    try {
      const stats = await fetchProfileStats(pubkey);
      setFollowerCount(stats.followerCount);
      setHasLoadedFollowerCount(true);
    } catch (error) {
      console.error('Failed to load follower count:', error);
      setFollowerCount(0);
    } finally {
      setIsLoadingFollowerCount(false);
    }
  };

  const handleRetweet = async (tweetId: string) => {
    // 現在のタブに応じて適切なデータセットを取得
    const getCurrentTweets = () => {
      switch (activeTab) {
        case 'posts': return tweets;
        case 'replies': return replies;
        case 'media': return mediaPosts;
        case 'likes': return likedPosts;
        default: return tweets;
      }
    };

    const setCurrentTweets = (newTweets: Tweet[]) => {
      switch (activeTab) {
        case 'posts': setTweets(newTweets); break;
        case 'replies': setReplies(newTweets); break;
        case 'media': setMediaPosts(newTweets); break;
        case 'likes': setLikedPosts(newTweets); break;
      }
    };

    const currentTweets = getCurrentTweets();
    const tweet = currentTweets.find(t => t.id === tweetId);
    if (!tweet) return;

    // 認証チェック
    if (!publicKey) {
      console.warn('Cannot retweet: User is not authenticated');
      return;
    }

    try {
      // 楽観的更新
      setCurrentTweets(currentTweets.map(t => {
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
        await retweet(tweetId, tweet.author.id);
      }
    } catch (error) {
      // エラー時は元に戻す
      setCurrentTweets(currentTweets.map(t => {
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
        <p className="text-gray-500 dark:text-gray-400">{t('profile.notFound')}</p>
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
        followCount={followingCount}
        followerCount={followerCount}
        onLoadFollowingCount={handleLoadFollowingCount}
        onLoadFollowerCount={handleLoadFollowerCount}
        isLoadingFollowingCount={isLoadingFollowingCount}
        isLoadingFollowerCount={isLoadingFollowerCount}
      />

      <main className="mx-auto mt-4 sm:mt-6 md:mt-8 lg:mt-10 w-full max-w-6xl px-3 sm:px-4 lg:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* プロフィール情報セクション */}
          <div className="w-full">
            <ProfileSidebar profile={profile} />
          </div>

          {/* タブとコンテンツセクション */}
          <section className="space-y-4 w-full">
            <div className="sticky top-14 sm:top-16 z-10 -mx-3 sm:-mx-4 lg:mx-0 bg-gray-100/95 backdrop-blur-sm dark:bg-black/95">
              <ProfileTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
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
                <TimelineList
                  tweets={replies}
                  isLoading={repliesLoading}
                  onLike={handleLike}
                  onRetweet={handleRetweet}
                  emptyMessage={t('profile.noReplies')}
                />
              )}

              {activeTab === 'media' && (
                <TimelineList
                  tweets={mediaPosts}
                  isLoading={mediaLoading}
                  onLike={handleLike}
                  onRetweet={handleRetweet}
                  emptyMessage={t('profile.noMedia')}
                />
              )}

              {activeTab === 'likes' && (
                <TimelineList
                  tweets={likedPosts}
                  isLoading={likesLoading}
                  onLike={handleLike}
                  onRetweet={handleRetweet}
                  emptyMessage={t('profile.noLikes')}
                />
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
