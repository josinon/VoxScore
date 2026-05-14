import { Logger } from '@nestjs/common';

/** Evita ruído no output quando specs simulam falhas de WS/JWT (RealtimeHubService / RealtimeGateway). */
beforeAll(() => {
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
});
