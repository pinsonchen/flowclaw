import { UnifiedMessage } from '@flowclaw/shared';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

/**
 * 处理消息，返回 AI 回复
 */
export async function processMessage(
  msg: UnifiedMessage,
  openaiApiKey?: string
): Promise<string> {
  console.log('[Processor] Processing message:', msg.id);

  // Initialize LLM
  const llm = new ChatOpenAI({
    openAIApiKey: openaiApiKey || process.env.OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
  });

  // Create prompt template
  const prompt = PromptTemplate.fromTemplate(
    `你是一个 AI 工作流助手。用户发送了一条消息，请根据消息内容给出合适的回复。

用户消息：{text}
渠道：{channel}
聊天类型：{chatType}

请给出简洁、有帮助的回复：`
  );

  // Create chain
  const chain = new LLMChain({ llm, prompt });

  // Execute
  const result = await chain.call({
    text: msg.content.text,
    channel: msg.channel,
    chatType: msg.chatType,
  });

  return result.text;
}
