// NIP-57: Lightning Zaps implementation

export interface ZapRequest {
  amount: number; // in millisatoshis
  pubkey: string; // recipient's public key
  content?: string; // optional message
  relays: string[]; // list of relays
  eventId?: string; // the event being zapped
}

export interface LnurlResponse {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  tag: string;
  allowsNostr?: boolean;
  nostrPubkey?: string;
}

/**
 * Get LNURL pay endpoint from a lightning address
 */
export async function getLnurlPayEndpoint(lightningAddress: string): Promise<LnurlResponse | null> {
  try {
    const [name, domain] = lightningAddress.split('@');
    if (!name || !domain) {
      throw new Error('Invalid lightning address format');
    }

    const url = `https://${domain}/.well-known/lnurlp/${name}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch LNURL endpoint');
    }

    const data = await response.json();
    return data as LnurlResponse;
  } catch (error) {
    console.error('Error fetching LNURL endpoint:', error);
    return null;
  }
}

/**
 * Create a zap request event (kind 9734)
 */
export function createZapRequest(params: ZapRequest): any {
  const zapRequest = {
    kind: 9734,
    content: params.content || '',
    tags: [
      ['relays', ...params.relays],
      ['amount', params.amount.toString()],
      ['p', params.pubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  if (params.eventId) {
    zapRequest.tags.push(['e', params.eventId]);
  }

  return zapRequest;
}

/**
 * Request a Lightning invoice for a zap
 */
export async function requestZapInvoice(
  lnurlResponse: LnurlResponse,
  amountSats: number,
  zapRequest?: any
): Promise<string | null> {
  try {
    const amountMilliSats = amountSats * 1000;
    
    if (amountMilliSats < lnurlResponse.minSendable || amountMilliSats > lnurlResponse.maxSendable) {
      throw new Error('Amount out of range');
    }

    const params = new URLSearchParams({
      amount: amountMilliSats.toString(),
    });

    if (zapRequest && lnurlResponse.allowsNostr) {
      params.append('nostr', JSON.stringify(zapRequest));
    }

    const invoiceUrl = `${lnurlResponse.callback}?${params.toString()}`;
    const response = await fetch(invoiceUrl);

    if (!response.ok) {
      throw new Error('Failed to get invoice');
    }

    const data = await response.json();
    return data.pr; // payment request (invoice)
  } catch (error) {
    console.error('Error requesting zap invoice:', error);
    return null;
  }
}

/**
 * Parse metadata to get user info
 */
export function parseMetadata(metadata: string): { name?: string; description?: string; image?: string } {
  try {
    const parsed = JSON.parse(metadata);
    const result: { name?: string; description?: string; image?: string } = {};

    for (const [key, value] of parsed) {
      if (key === 'text/plain') {
        result.description = value;
      } else if (key === 'text/identifier') {
        result.name = value;
      } else if (key === 'image/png' || key === 'image/jpeg') {
        result.image = value;
      }
    }

    return result;
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return {};
  }
}