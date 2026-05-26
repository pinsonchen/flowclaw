/**
 * 统一消息格式
 * 所有渠道的消息都转换为这个标准格式
 */

export type ChannelType = 'telegram' | 'email' | 'wechat' | 'discord' | 'slack';
export type ChatType = 'direct' | 'group';
export type ContentType = 'text' | 'image' | 'file' | 'audio' | 'sticker';

export interface UnifiedMessage {
  id: string;
  channel: ChannelType;
  chatType: ChatType;
  chatId: string;
  sender: {
    id: string;
    name: string;
    username?: string;
  };
  content: {
    type: ContentType;
    text: string;
    fileId?: string;
  };
  timestamp: number;
  raw?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  messageId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: UnifiedMessage;
  output?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'process' | 'action';
  config: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
