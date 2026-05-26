/**
 * 统一消息格式定义
 * 所有渠道的消息都转换为这个标准格式，转发给 engine 处理
 */

/**
 * @typedef {Object} UnifiedMessage
 * @property {string} id
 * @property {string} channel       // 'telegram' | 'email' | 'wechat' ...
 * @property {string} chatType      // 'direct' | 'group'
 * @property {string} chatId        // 用户 ID 或群 ID
 * @property {Object} sender
 * @property {string} sender.id
 * @property {string} sender.name
 * @property {string} sender.username
 * @property {Object} content
 * @property {'text'|'image'|'file'|'audio'} content.type
 * @property {string} [content.text]
 * @property {string} [content.fileId]
 * @property {number} timestamp
 * @property {Object} raw           // 原始消息体，供调试
 */

/**
 * 将渠道消息转换为统一格式
 */
function toUnifiedMessage(channel, raw) {
  return {
    id: raw.message_id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel,
    chatType: raw.chat?.type === 'private' ? 'direct' : 'group',
    chatId: String(raw.chat?.id || ''),
    sender: {
      id: String(raw.from?.id || ''),
      name: [raw.from?.first_name, raw.from?.last_name].filter(Boolean).join(' '),
      username: raw.from?.username || '',
    },
    content: {
      type: raw.text ? 'text' : raw.photo ? 'image' : raw.document ? 'file' : raw.audio ? 'audio' : 'text',
      text: raw.text || raw.caption || '',
      fileId: (raw.photo?.[raw.photo.length - 1] || raw.document || raw.audio || {}).file_id || '',
    },
    timestamp: (raw.date || Math.floor(Date.now() / 1000)) * 1000,
    raw,
  };
}

module.exports = { toUnifiedMessage };
