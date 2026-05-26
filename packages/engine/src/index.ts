import express from 'express';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { UnifiedMessage } from '@flowclaw/shared';
import { processMessage } from './core/processor';

export interface EngineConfig {
  port: number;
  redis: {
    host: string;
    port: number;
  };
  openaiApiKey?: string;
}

export class Engine {
  private app: express.Application;
  private queue: Queue;
  private worker: Worker;
  private redis: IORedis;

  constructor(private config: EngineConfig) {
    this.app = express();
    this.app.use(express.json());

    this.redis = new IORedis(config.redis);
    this.queue = new Queue('flowclaw-messages', { connection: this.redis });

    // Worker to process messages from queue
    this.worker = new Worker(
      'flowclaw-messages',
      async (job) => {
        const msg = job.data as UnifiedMessage;
        console.log('[Engine] Processing message:', msg.id);
        const reply = await processMessage(msg, config.openaiApiKey);
        return reply;
      },
      { connection: this.redis }
    );

    // Routes
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/executions/:id', async (req, res) => {
      // TODO: Fetch execution from DB
      res.json({ id: req.params.id, status: 'pending' });
    });
  }

  async start(): Promise<void> {
    this.app.listen(this.config.port, () => {
      console.log(`[Engine] Started on port ${this.config.port}`);
    });
  }

  async stop(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

// CLI entry
if (require.main === module) {
  const engine = new Engine({
    port: parseInt(process.env.ENGINE_PORT || '3000'),
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  engine.start().catch((err) => {
    console.error('[Engine] Failed to start:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => engine.stop());
  process.on('SIGTERM', () => engine.stop());
}
