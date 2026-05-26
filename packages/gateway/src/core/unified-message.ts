import { UnifiedMessage, ContentType } from '@flowclaw/shared';
import { Api } from 'grammy';

export function toUnifiedMessage(channel: 'telegram', raw: Api.Message): UnifiedMessage {
  const content: {
    type: ContentType;
    text: string;
    fileId?: string;
  } = {
    type: 'text',
    text: '',
  };

  if (raw.text) {
    content.type = 'text';
    content.text = raw.text;
  } else if (raw.caption) {
    content.type = 'text';
    content.text = raw.caption;
  }

  const photo = raw.photo?.[raw.photo.length - 1];
  const document = raw.document;
  const audio = raw.audio;
  const file = photo || document || audio;

  if (photo) content.type = 'image';
  else if (document) content.type = 'file';
  else if (audio) content.type = 'audio';

  if (file) content.fileId = file.file_id;

  return {
    id: `${raw.date}-${raw.message_id}`,
    channel,
    chatType: raw.chat.type === 'private' ? 'direct' : 'group',
    chatId: String(raw.chat.id),
    sender: {
      id: String(raw.from?.id || ''),
      name: [raw.from?.first_name, raw.from?.last_name].filter(Boolean).join(' '),
      username: raw.from?.username,
    },
    content,
    timestamp: (raw.date || Math.floor(Date.now() / 1000)) * 1000,
    raw,
  };
}
