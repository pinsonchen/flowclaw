/**
 * Telegram Bot Adapter
 * 使用 grammy 框架接收和发送消息
 * 
 * 环境变量:
 *   TELEGRAM_BOT_TOKEN - Bot Token (from @BotFather)
 *   TELEGRAM_WEBHOOK_URL - Webhook URL (可选，默认用 polling)
 */

const { Bot, webhookCallback } = require('grammy');
const { toUnifiedMessage } = require('../core/unified-message');

class TelegramAdapter {
  constructor(config = {}) {
    this.token = config.token || process.env.TELEGRAM_BOT_TOKEN;
    this.webhookUrl = config.webhookUrl || process.env.TELEGRAM_WEBHOOK_URL;
    this.bot = null;
    this.onMessageHandler = null;
    this.onErrorHandler = null;
  }

  /**
   * 初始化 Bot，注册消息处理器
   */
  async init() {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new Bot(this.token);

    // 注册消息处理器
    this.bot.on('message:text', async (ctx) => {
      const unified = toUnifiedMessage('telegram', ctx.message);
      if (this.onMessageHandler) {
        await this.onMessageHandler(unified);
      }
    });

    // 注册错误处理器
    this.bot.catch((err) => {
      console.error('[TelegramAdapter] Error:', err.message);
      if (this.onErrorHandler) {
        this.onErrorHandler(err);
      }
    });

    console.log('[TelegramAdapter] Bot initialized');
  }

  /**
   * 启动 Bot（polling 模式）
   */
  async start() {
    await this.init();

    if (this.webhookUrl) {
      // Webhook 模式
      await this.bot.api.setWebhook(this.webhookUrl);
      console.log(`[TelegramAdapter] Webhook set: ${this.webhookUrl}`);
    } else {
      // Polling 模式（开发环境默认）
      await this.bot.start();
      console.log('[TelegramAdapter] Polling started');
    }
  }

  /**
   * 停止 Bot
   */
  async stop() {
    if (this.bot) {
      this.bot.stop();
      console.log('[TelegramAdapter] Bot stopped');
    }
  }

  /**
   * 获取 Webhook 回调处理器（用于 Express/Fastify 等框架）
   */
  getWebhookCallback() {
    if (!this.bot) {
      throw new Error('Bot not initialized. Call init() first.');
    }
    return webhookCallback(this.bot, 'express');
  }

  /**
   * 发送消息到指定聊天
   * @param {string} chatId - 聊天 ID
   * @param {string} text - 消息文本
   * @param {Object} options - 额外选项（回复消息、键盘等）
   */
  async send(chatId, text, options = {}) {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    return this.bot.api.sendMessage(chatId, text, options);
  }

  /**
   * 回复指定消息
   */
  async reply(chatId, text, replyToMessageId) {
    return this.send(chatId, text, { reply_to_message_id: replyToMessageId });
  }

  /**
   * 注册消息处理回调
   */
  onMessage(handler) {
    this.onMessageHandler = handler;
  }

  /**
   * 注册错误处理回调
   */
  onError(handler) {
    this.onErrorHandler = handler;
  }
}

module.exports = { TelegramAdapter };
