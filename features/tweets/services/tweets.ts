import { CreateTweetRequest, CreateTweetResponse } from '../types';
import { Tweet } from '../../timeline/types';
import { publishNote } from '../../notes/publish';
import { useProfileStore } from '../../../stores/profile.store';
import { useAuthStore } from '../../../stores/auth.store';

function buildAuthor(): Tweet['author'] {
  const profileState = useProfileStore.getState();
  const authState = useAuthStore.getState();
  const profile = profileState.current;

  const npub = profile?.npub || authState.npub || authState.publicKey || 'anonymous';
  const displayName = profile?.displayName || profile?.name || npub.slice(0, 12);

  return {
    id: profile?.npub || authState.publicKey || npub,
    username: profile?.name || npub.slice(0, 12),
    name: displayName,
    avatar: profile?.picture || `https://robohash.org/${npub}`,
    bio: profile?.about || '',
    followersCount: 0,
    followingCount: 0,
    createdAt: new Date(),
  };
}

export async function createTweet(request: CreateTweetRequest): Promise<CreateTweetResponse> {
  const content = request.content?.trim();

  if (!content) {
    throw new Error('ツイートの内容を入力してください');
  }

  if (content.length > 280) {
    throw new Error('ツイートは280文字以内で入力してください');
  }

  // 画像をnostr.buildにアップロード
  let imageUrls: string[] = [];
  if (request.media && request.media.length > 0) {
    const { uploadMultipleImages } = await import('../../media/upload');
    try {
      imageUrls = await uploadMultipleImages(request.media);
    } catch (uploadError) {
      console.error('Failed to upload images:', uploadError);
      throw new Error('画像のアップロードに失敗しました');
    }
  }

  // 画像URLを含めたコンテンツを作成
  let finalContent = content;
  if (imageUrls.length > 0) {
    // コンテンツの末尾に画像URLを追加
    const imageText = imageUrls.map(url => `\n${url}`).join('');
    finalContent = content + imageText;
  }

  // リプライの場合はNIP-10に従ってタグを追加
  const extra = request.parentId ? {
    replyToId: request.parentId,
    replyAuthor: request.parentAuthor,
    rootId: request.rootId,
    rootAuthor: request.rootAuthor,
  } : undefined;
  const publishResult = await publishNote(finalContent, extra);

  if (!publishResult.ok || !publishResult.event) {
    throw new Error('ノートの投稿に失敗しました');
  }

  const event = publishResult.event;
  const author = buildAuthor();

  const tweet: Tweet = {
    id: event.id,
    content: event.content,
    author,
    createdAt: new Date(event.created_at * 1000),
    likesCount: 0,
    retweetsCount: 0,
    repliesCount: 0,
    zapsCount: 0,
    isLiked: false,
    isRetweeted: false,
    tags: event.tags as string[][],
  };

  return { tweet };
}

export async function deleteTweet(_tweetId: string): Promise<void> {
  throw new Error('ツイートの削除はまだ実装されていません');
}
