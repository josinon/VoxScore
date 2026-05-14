import type { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';

/** Alinha os e2e com `main.ts` (gateway WebSocket). */
export function configureNestWs(app: INestApplication): void {
  app.useWebSocketAdapter(new WsAdapter(app));
}
