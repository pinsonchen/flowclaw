import { TelegramAdapter } from './adapters/telegram';
import { UnifiedMessage } from '@flowclaw/shared';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export interface GatewayConfig {
  telegram?: {
    token: string;
    webhookUrl?: string;
  };
  redis: {
    host: string;
    port: number;
  };
  engineUrl: string;
}

export class Gateway {
  private adapters: Record<string, TelegramAdapter> = {};
  private queue: Queue;
  private redis: IORedis;

  constructor(private config: GatewayConfig) {
    this.redis = new IORedis(config.redis);
    this.queue = new Queue('flowclaw-messages', { connection: this.redis });
  }

  async start(): Promise<void> {
    console.log('[Gateway] Starting...');

    // Telegram
    if (this.config.telegram) {
      const telegram = new TelegramAdapter({
        token: this.config.telegram.token,
        webhookUrl: this.config.telegram.webhookUrl,
      });

      telegram.onMessage(async (unifiedMsg: UnifiedMessage) => {
        console.log('[Gateway] Received message:', JSON.stringify(unifiedMsg, null, 2));
        // Push to queue for engine processing
        await this.queue.add('process-message', unifiedMsg);
      });

      await telegram.start();
      this.adapters.telegram = telegram;
    }

    console.log('[Gateway] Started. Active adapters:', Object.keys(this.adapters));
  }

  async stop(): Promise<void> {
    for (const adapter of Object.values(this.adapters)) {
      await adapter.stop();
    }
    await this.queue.close();
    await this.redis.quit();
    console.log('[Gateway] Stopped');
  }
}

// CLI entry
if (require.main === module) {
  const gateway = new Gateway({
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN!,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    engineUrl: process.env.ENGINE_URL || 'http://localhost:3000',
  });

  gateway.start().catch((err) => {
    console.error('[Gateway] Failed to start:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => gateway.stop());
  process.on('SIGTERM', () => gateway.stop());
}
