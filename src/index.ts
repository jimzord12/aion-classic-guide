import { createContainer } from './config/di';
import { env } from './config/env';
import { createApp } from './infra/http/elysia/app';

import './config/env'; // ensure env loaded/validated

const container = createContainer();
const app = createApp(container);

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
