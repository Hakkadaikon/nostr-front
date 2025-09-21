"use client";

import { SearchResult, SearchType } from '../../features/search/types';
import { TimelineItem } from '../timeline/TimelineItem';
import { UserCard } from './UserCard';
import { Spinner } from '../ui/Spinner';

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

  const hasResults = 
    (searchType !== 'tweets' && results.users.length > 0) || 
    (searchType !== 'users' && results.tweets.length > 0);

  if (!hasResults) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          検索結果が見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {/* ユーザー検索結果 */}
      {searchType !== 'tweets' && results.users.length > 0 && (
        <div>
          {searchType === 'all' && (
            <h2 className="px-4 py-3 text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50">
              ユーザー
            </h2>
          )}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {results.users.map((user) => (
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
      {searchType !== 'users' && results.tweets.length > 0 && (
        <div>
          {searchType === 'all' && (
            <h2 className="px-4 py-3 text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50">
              ツイート
            </h2>
          )}
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