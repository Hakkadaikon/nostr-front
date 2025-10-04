"use client";

import { SearchResult, SearchType } from '../../features/search/types';
import { TimelineItem } from '../timeline/TimelineItem';
import { UserCard } from './UserCard';
import { Spinner } from '../ui/Spinner';
import { toTimestamp } from '../../lib/utils/date';

interface SearchResultsProps {
  results: SearchResult | null;
  isLoading: boolean;
  searchType: SearchType;
  onLike: (tweetId: string) => void;
  onRetweet: (tweetId: string) => void;
  onFollow?: (userId: string) => void;
}

export function SearchResults({
  results,
  isLoading,
  searchType,
  onLike,
  onRetweet,
  onFollow,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const hasResults = searchType === 'users'
    ? results.users.length > 0
    : results.tweets.length > 0;

  if (!hasResults) {
    const emptyMessage = searchType === 'users'
      ? '一致するユーザーが見つかりませんでした'
      : '一致する投稿が見つかりませんでした';
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ユーザー検索結果 */}
      {searchType === 'users' && results.users.length > 0 && (
        <div className="w-full">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {results.users
              .filter((user, index, self) => 
                // 公開鍵（user.id）でユニークにする
                index === self.findIndex((u) => u.id === user.id)
              )
              .sort((a, b) => {
                // ソート優先順位:
                // 1. botでないアカウントを優先
                const aIsBot = a.bio?.toLowerCase().includes('bot') || 
                               a.username.toLowerCase().includes('bot') ||
                               a.bio?.includes('author :') ||
                               a.bio?.includes('author:');
                const bIsBot = b.bio?.toLowerCase().includes('bot') || 
                               b.username.toLowerCase().includes('bot') ||
                               b.bio?.includes('author :') ||
                               b.bio?.includes('author:');
                
                if (aIsBot !== bIsBot) {
                  return aIsBot ? 1 : -1;
                }
                
                // 2. テストアカウントでないものを優先
                const aIsTest = a.username.toLowerCase().includes('test') ||
                               a.bio?.toLowerCase().includes('test') ||
                               a.bio?.includes('owner :') ||
                               a.bio?.includes('owner:');
                const bIsTest = b.username.toLowerCase().includes('test') ||
                               b.bio?.toLowerCase().includes('test') ||
                               b.bio?.includes('owner :') ||
                               b.bio?.includes('owner:');
                
                if (aIsTest !== bIsTest) {
                  return aIsTest ? 1 : -1;
                }
                
                // 3. プロフィールが充実しているものを優先（bioの長さ）
                const aBioLength = a.bio?.length || 0;
                const bBioLength = b.bio?.length || 0;
                if (aBioLength !== bBioLength) {
                  return bBioLength - aBioLength;
                }
                
                // 4. 作成日時が新しいものを優先
                return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
              })
              .slice(0, 10) // 上位10件のみ表示
              .map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onFollow={onFollow}
                />
              ))}
          </div>
        </div>
      )}

      {/* ツイート検索結果 */}
      {searchType === 'tweets' && results.tweets.length > 0 && (
        <div className="w-full">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {results.tweets.map((tweet) => (
              <TimelineItem
                key={tweet.id}
                tweet={tweet}
                onLike={onLike}
                onRetweet={onRetweet}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
