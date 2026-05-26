/**
 * FlowClaw Gateway - 消息网关入口
 * 
 * 职责:
 * 1. 启动各渠道 Adapter（Telegram/Email/...）
 * 2. 将统一格式消息转发给 Engine
 * 3. 接收 Engine 回复，通过原渠道返回
 */

const { TelegramAdapter } = require('./adapters/telegram');

class Gateway {
  constructor(config = {}) {
    this.config = config;
    this.adapters = {};
    this.engineUrl = config.engineUrl || 'http://localhost:8000';
  }

  /**
   * 启动所有已配置的 Adapter
   */
  async start() {
    console.log('[Gateway] Starting...');

    // Telegram
    if (this.config.telegram?.token) {
      const telegram = new TelegramAdapter({
        token: this.config.telegram.token,
        webhookUrl: this.config.telegram.webhookUrl,
      });

      // 消息到达时，转发给 Engine
      telegram.onMessage(async (unifiedMsg) => {
        console.log('[Gateway] Received message:', JSON.stringify(unifiedMsg, null, 2));
        // TODO: POST to engine
        // const response = await fetch(`${this.engineUrl}/process`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(unifiedMsg),
        // });
        // const reply = await response.json();
        // await telegram.send(unifiedMsg.chatId, reply.text);
      });

      await telegram.start();
      this.adapters.telegram = telegram;
    }

    console.log('[Gateway] Started. Active adapters:', Object.keys(this.adapters));
  }

  /**
   * 停止所有 Adapter
   */
  async stop() {
    for (const [name, adapter] of Object.entries(this.adapters)) {
      await adapter.stop();
    }
    console.log('[Gateway] Stopped');
  }
}

// CLI 入口
if (require.main === module) {
  const gateway = new Gateway({
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },
    engineUrl: process.env.ENGINE_URL || 'http://localhost:8000',
  });

  gateway.start().catch((err) => {
    console.error('[Gateway] Failed to start:', err);
    process.exit(1);
  });

  // 优雅退出
  process.on('SIGINT', () => gateway.stop());
  process.on('SIGTERM', () => gateway.stop());
}

module.exports = { Gateway };
