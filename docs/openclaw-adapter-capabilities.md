# 🔌 OpenClaw 消息接入层能力清单

> 整理人：mac龙虾 | 日期：2025-07-10

## 一、现有架构概览

OpenClaw 已经是一个**多通道消息网关**，天然支持 25+ 个消息平台。
我们的"跨平台 AI 工作流引擎"可以直接复用其接入层能力。

### 核心设计模式
```
Inbound Message → Channel Adapter → Gateway Router → Agent Session → AI Processing → Reply Routing
```

- **消息路由**：回复自动回到来源通道，确定性路由
- **会话隔离**：每个通道/群组/线程有独立 Session Key
- **多 Agent 支持**：不同通道可绑定不同 Agent
- **广播模式**：支持多 Agent 并行处理同一消息

## 二、已支持通道完整清单

### ✅ 生产就绪（官方维护）

| 通道 | 类型 | 接入方式 | 特性 |
|------|------|---------|------|
| **Telegram** | Bot API | grammY 框架 | 群组、内联键盘、Webhook |
| **WhatsApp** | QR 配对 | Baileys | 最流行，需扫码 |
| **Discord** | Bot + Gateway | 官方 API | 服务器、频道、DM、Thread |
| **Slack** | Bolt SDK | Workspace App | 频道、DM、Thread |
| **Signal** | signal-cli | 隐私优先 | DM |
| **iMessage** | BlueBubbles | macOS REST API | 全功能支持 |
| **LINE** | Messaging API | Bundled Plugin | 官方 Bot |
| **QQ Bot** | 官方 API | Bundled Plugin | 私聊、群聊、富媒体 |
| **微信 (iLink)** | 腾讯官方 | npm 插件 | 企业微信，私聊 |
| **飞书 (Feishu)** | WebSocket | Bundled Plugin | 企业协作 |
| **Microsoft Teams** | Bot Framework | Bundled Plugin | 企业支持 |
| **Google Chat** | HTTP Webhook | API App | Google 生态 |
| **Mattermost** | WebSocket | Bundled Plugin | 自托管 |
| **Matrix** | Protocol | Bundled Plugin | 去中心化 |
| **IRC** | 经典协议 | 频道 + DM | 老派但稳定 |
| **Nostr** | NIP-04 | Bundled Plugin | 去中心化 DM |
| **Twitch** | IRC | Bundled Plugin | 直播聊天 |
| **Zalo** | Bot API | Bundled Plugin | 越南市场 |
| **Synology Chat** | Webhook | Bundled Plugin | NAS 集成 |
| **Nextcloud Talk** | API | Bundled Plugin | 自托管 |
| **Tlon (Urbit)** | Protocol | Bundled Plugin | Urbit 生态 |
| **WebChat** | WebSocket | 内置 UI | 网关自带 |
| **BlueBubbles** | REST API | 推荐 iMessage | 全功能 |

### ⚠️ 高风险（不建议 MVP 使用）
| 通道 | 风险 | 原因 |
|------|------|------|
| 微信个人号 | 🔴 封号 | itchat/wxpy 已大面积封号 |
| Zalo Personal | 🟡 封号 | 个人号 QR 登录，有风控 |

## 三、接入层 API 设计（对外暴露）

基于 OpenClaw 现有能力，我们可以抽象出统一的 **Event 接口**：

```typescript
interface ChannelEvent {
  id: string;              // 消息唯一 ID
  channel: string;         // 通道类型: telegram/whatsapp/discord/...
  accountId?: string;      // 多账号支持
  sessionId: string;       // 会话 Key
  type: 'message' | 'reaction' | 'edit' | 'delete';
  sender: {
    id: string;
    name?: string;
    isBot?: boolean;
  };
  content: {
    text?: string;
    media?: { url: string; type: string };
    replyTo?: { id: string; body: string; sender: string };
  };
  metadata: {
    timestamp: number;
    groupId?: string;
    threadId?: string;
    raw?: any;             // 原始消息体，供高级场景使用
  };
}

interface ChannelAdapter {
  // 接收消息（Webhook 或 Polling）
  on(event: 'message', handler: (event: ChannelEvent) => void): void;
  
  // 发送消息
  send(event: ChannelEvent, reply: ReplyPayload): Promise<SendResult>;
  
  // 反应/编辑/删除
  react(eventId: string, emoji: string): Promise<void>;
  edit(eventId: string, content: string): Promise<void>;
  delete(eventId: string): Promise<void>;
}
```

## 四、与现有 OpenClaw 的集成方案

### 方案 A：插件模式（推荐 MVP）
```
OpenClaw Gateway
  └── skyflip-workflow-plugin  ← 我们的插件
        ├── 监听特定通道消息
        ├── 触发工作流引擎
        └── 通过 OpenClaw reply 机制返回结果
```

**优点**：
- 零重复开发，直接复用 25+ 通道
- 部署简单，一个 OpenClaw 实例搞定
- 天然支持会话管理、路由、安全

**实现**：
1. 开发 OpenClaw 插件（Hook 机制）
2. 插件内嵌工作流引擎
3. 消息命中工作流规则时触发执行

### 方案 B：独立服务 + Adapter
```
skyflip-engine (独立服务)
  ├── telegram-adapter
  ├── whatsapp-adapter
  ├── discord-adapter
  └── ... (复用 OpenClaw 的 adapter 代码)
```

**优点**：
- 完全独立，不依赖 OpenClaw
- 可部署到任何平台

**缺点**：
- 需要重新实现所有 adapter
- 维护成本高

### 方案 C：混合模式（长期）
```
MVP: 方案 A（插件模式，快速验证）
  ↓
V2:  方案 A + 独立部署选项
  ↓
V3:  方案 B（完全独立，按需选择）
```

## 五、可视化编排界面技术选型

| 组件 | 推荐方案 | 理由 |
|------|---------|------|
| 框架 | Vue 3 + TypeScript | 生态成熟，国内开发者友好 |
| 拖拽编辑器 | vue-flow / elkjs | 节点式工作流，类似 n8n |
| 状态管理 | Pinia | Vue 官方推荐 |
| UI 组件 | Element Plus / Naive UI | 企业级组件库 |
| 后端 API | Hono (轻量) | 与 OpenClaw 同栈 |

### 界面设计草图
```
┌─────────────────────────────────────────────────┐
│  📡 工作流编排器                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [📩 触发器] ──→ [🤖 AI 处理] ──→ [📤 发送回复]   │
│     Telegram         文本分析         微信         │
│     关键词: "报销"    提取金额/日期     模板消息     │
│                                                 │
│  [📩 触发器] ──→ [🔍 搜索] ──→ [📊 汇总]          │
│     邮件             GitHub API       生成报告     │
│     主题: "PR"       搜索 PR           邮件发送     │
│                                                 │
│  [+ 添加节点]  [保存]  [测试运行]  [发布]          │
└─────────────────────────────────────────────────┘
```

## 六、MVP 阶段接入优先级

```
P0 (Week 1): Telegram Adapter + WebChat
P1 (Week 2): 邮件 Adapter (IMAP)
P2 (Week 3): QQ Bot Adapter
P3 (Week 4): 企业微信 Adapter
```

## 七、关键风险与应对

| 风险 | 等级 | 应对策略 |
|------|------|---------|
| OpenClaw 插件 API 不稳定 | 🟡 中 | 先基于现有 Hook 机制，预留独立部署能力 |
| 微信个人号封号 | 🔴 高 | 只做企业微信/iLink 官方通道 |
| 多通道消息格式差异 | 🟡 中 | 统一 ChannelEvent 接口，adapter 层做转换 |
| 并发处理 | 🟢 低 | OpenClaw 已有会话锁，工作流引擎用队列 |

---

**结论：OpenClaw 已具备 25+ 通道的接入能力，MVP 阶段直接复用，聚焦工作流引擎本身。**
