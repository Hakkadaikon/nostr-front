// @ts-nocheck
import { WebSocketServer } from 'ws';

export function startMockRelayServer(port = 7447) {
  const wss = new WebSocketServer({ port });
  wss.on('connection', ws => {
    ws.on('message', (msg) => {
      // Echo back
      ws.send(msg);
    });
  });
  return { close: () => wss.close() };
}
