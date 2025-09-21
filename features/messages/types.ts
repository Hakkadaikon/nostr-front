import { User } from '../timeline/types';

// メッセージ
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: Date;
  read: boolean;
  sender?: User;
  receiver?: User;
}

// 会話（DM相手とのやりとり）
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// メッセージ送信リクエスト
export interface SendMessageRequest {
  content: string;
  receiverId: string;
}

// メッセージ送信レスポンス
export interface SendMessageResponse {
  message: Message;
}

// 会話一覧のパラメータ
export interface ConversationsParams {
  cursor?: string;
  limit?: number;
}

// 会話一覧のレスポンス
export interface ConversationsResponse {
  conversations: Conversation[];
  nextCursor?: string;
  hasMore: boolean;
}

// メッセージ一覧のパラメータ
export interface MessagesParams {
  conversationId: string;
  cursor?: string;
  limit?: number;
}

// メッセージ一覧のレスポンス
export interface MessagesResponse {
  messages: Message[];
  nextCursor?: string;
  hasMore: boolean;
}

// メッセージエラー
export interface MessageError {
  code: string;
  message: string;
  details?: any;
}

// メッセージの状態
export interface MessagesState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: MessageError | null;
}