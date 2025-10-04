import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export const alt = 'hamnostr';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #1DA1F2, #14171A)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 160, fontWeight: 'bold' }}>
          hamnostr
        </div>
        <div style={{ fontSize: 48, marginTop: 20, opacity: 0.9 }}>
          A Nostr client built with Next.js
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
