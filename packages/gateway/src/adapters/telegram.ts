import { Bot, webhookCallback } from 'grammy';
import { UnifiedMessage, ChannelType } from '@flowclaw/shared';
import { toUnifiedMessage } from '../core/unified-message';

export interface TelegramAdapterConfig {
  token: string;
  webhookUrl?: string;
}

export class TelegramAdapter {
  private bot: Bot;
  private onMessageHandler?: (msg: UnifiedMessage) => Promise<void>;
  private onErrorHandler?: (err: Error) => void;

  constructor(private config: TelegramAdapterConfig) {
    this.bot = new Bot(config.token);
  }

  async init(): Promise<void> {
    // Register message handler
    this.bot.on('message:text', async (ctx) => {
      const unified = toUnifiedMessage('telegram', ctx.message);
      if (this.onMessageHandler) {
        await this.onMessageHandler(unified);
      }
    });

    // Register error handler
    this.bot.catch((err) => {
      console.error('[TelegramAdapter] Error:', err.message);
      if (this.onErrorHandler) {
        this.onErrorHandler(err);
      }
    });

    console.log('[TelegramAdapter] Bot initialized');
  }

  async start(): Promise<void> {
    await this.init();

    if (this.config.webhookUrl) {
      await this.bot.api.setWebhook(this.config.webhookUrl);
      console.log(`[TelegramAdapter] Webhook set: ${this.config.webhookUrl}`);
    } else {
      await this.bot.start();
      console.log('[TelegramAdapter] Polling started');
    }
  }

  async stop(): Promise<void> {
    if (this.bot) {
      this.bot.stop();
      console.log('[TelegramAdapter] Bot stopped');
    }
  }

  getWebhookCallback() {
    return webhookCallback(this.bot, 'express');
  }

  async send(chatId: string, text: string, options?: Record<string, unknown>): Promise<void> {
    await this.bot.api.sendMessage(chatId, text, options);
  }

  async reply(chatId: string, text: string, replyToMessageId: number): Promise<void> {
    await this.send(chatId, text, { reply_to_message_id: replyToMessageId });
  }

  onMessage(handler: (msg: UnifiedMessage) => Promise<void>): void {
    this.onMessageHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.onErrorHandler = handler;
  }
}
