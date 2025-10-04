import { getLnurlPayEndpoint, requestZapInvoice, createZapRequest } from '../../../lib/nostr/nip57';
import { decode } from '../../../lib/nostr/nip19';
import { useRelaysStore } from '../../../stores/relays.store';

export interface GenerateZapInvoiceParams {
  recipientNpub: string;
  recipientLnAddress: string;
  amountSats: number;
  message?: string;
  eventId?: string;
}

export async function generateZapInvoice(params: GenerateZapInvoiceParams): Promise<string> {
  const { recipientNpub, recipientLnAddress, amountSats, message, eventId } = params;

  // デコードしてpubkeyを取得
  let recipientPubkey: string;
  try {
    const decoded = decode(recipientNpub);
    if (decoded.type !== 'npub') {
      throw new Error('Invalid npub');
    }
    recipientPubkey = decoded.data as string;
  } catch (error) {
    throw new Error('無効なnpubです');
  }

  // LNURLエンドポイントを取得
  const lnurlResponse = await getLnurlPayEndpoint(recipientLnAddress);
  if (!lnurlResponse) {
    throw new Error('Lightning Addressからの情報取得に失敗しました');
  }

  // 金額のチェック
  const amountMilliSats = amountSats * 1000;
  if (amountMilliSats < lnurlResponse.minSendable) {
    throw new Error(`最小金額は ${Math.ceil(lnurlResponse.minSendable / 1000)} satsです`);
  }
  if (amountMilliSats > lnurlResponse.maxSendable) {
    throw new Error(`最大金額は ${Math.floor(lnurlResponse.maxSendable / 1000)} satsです`);
  }

  // Zap requestを作成（Nostr対応の場合）
  let zapRequest = null;
  if (lnurlResponse.allowsNostr && lnurlResponse.nostrPubkey) {
    const relays = useRelaysStore.getState().relays
      .filter(r => r.read || r.write)
      .map(r => r.url);

    zapRequest = createZapRequest({
      amount: amountMilliSats,
      pubkey: recipientPubkey,
      content: message,
      relays: relays.length > 0 ? relays : ['wss://relay.damus.io', 'wss://nos.lol'],
      eventId,
    });

    // TODO: ここでzap requestに署名する必要がある
    // 現在はwindow.nostrを使った署名を実装する必要がある
  }

  // インボイスを取得
  const invoice = await requestZapInvoice(lnurlResponse, amountSats, zapRequest);
  if (!invoice) {
    throw new Error('インボイスの取得に失敗しました');
  }

  return invoice;
}

// テスト用のデフォルトLightning Address
export const DEFAULT_TEST_LN_ADDRESS = 'satoshi@walletofsatoshi.com';