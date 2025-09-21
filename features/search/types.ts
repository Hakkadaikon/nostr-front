import { Tweet, User } from '../timeline/types';

// 検索タイプ
export type SearchType = 'all' | 'users' | 'tweets';

// 検索パラメータ
export interface SearchParams {
  query: string;
  type: SearchType;
  cursor?: string;
  limit?: number;
}

// 検索結果
export interface SearchResult {
  users: User[];
  tweets: Tweet[];
  nextCursor?: string;
  hasMore: boolean;
}

// 検索エラー
export interface SearchError {
  code: string;
  message: string;
  details?: any;
}

// 検索状態
export interface SearchState {
  query: string;
  results: SearchResult | null;
  isLoading: boolean;
  error: SearchError | null;
  searchType: SearchType;
}

// トレンド
export interface Trend {
  hashtag: string;
  count: number;
  category?: string;
}