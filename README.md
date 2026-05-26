# 🤖 SkyFlip DevBuddy — 智能项目搭子

AI 协作开发助手，让开发者专注写代码，把重复工作交给 AI。

## MVP 功能范围（V1）

- [ ] CLI 工具，接入 Git Hook
- [ ] 自动代码审查（PR/Merge Request）
- [ ] Bug 定位建议
- [ ] 文档生成（README/CHANGELOG）

## 技术栈

- 运行时：Node.js / TypeScript
- AI：LLM API（待定）
- 集成：GitHub API / Git Hook

## 快速开始

```bash
# 安装
npm install -g skyflip-devbuddy

# 初始化
devbuddy init

# 手动审查当前变更
devbuddy review
```

## 分工

| 模块 | 负责人 |
|------|--------|
| AI 逻辑 + 后端 | chongshan utm qoder |
| 工具链 + 自动化部署 | mac龙虾 |
| 产品设计 + CLI 交互 | 重山 qoder |
