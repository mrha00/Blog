# BlogWeb — 博客前端

React 单页应用，与同仓库 [BlogApi](../README.md) REST API 联调，实现 Blog 全栈项目的用户界面层。

## 项目简介

BlogWeb 面向三类用户：**读者**浏览与评论、**作者**写作与资料管理、**管理员**维护分类标签。页面采用 React Router 路由守卫（登录 / Admin），Axios 统一携带 JWT，并对 API 分页、枚举状态、嵌套评论等做了适配层封装。

技术选型侧重**可维护与可测试**：TypeScript 类型约束、Vitest 单元测试、Playwright E2E 覆盖主链路，配合 `scripts/integration-test.mjs` 做 API 契约回归。

## 技术栈

`React 19` · `TypeScript` · `Vite` · `Tailwind CSS` · `React Router` · `Axios` · `Vitest` · `Playwright`

## 功能概览

- **首页**：分类/标签筛选、搜索、分页、「我的草稿」Tab
- **文章**：详情、Markdown 渲染、浏览量、草稿/发布状态
- **评论**：嵌套回复、作者头像、作者/管理员删除
- **作者**：编辑器、封面上传、发布/下架
- **个人资料**：头像、昵称、修改密码（`/profile`）
- **管理**：分类/标签 CRUD（Admin）
- **认证**：注册（昵称）、登录、JWT 会话

## 快速开始

**前置**：Node.js 18+，后端已启动（见仓库根目录 README）

```bash
cd blogweb
npm install
copy .env.example .env.local   # Windows
# 编辑 .env.local：VITE_API_BASE_URL=http://localhost:6133
npm run dev
```

前端默认：**http://localhost:3000**

演示账号与 API 一致：`admin / 123456`（Admin），`alice / 123456`（User）。

## 测试

```bash
npm test                  # 单元测试（Vitest）
npm run test:integration  # API 集成（需 BlogApi :6133）
npm run test:e2e          # E2E（Playwright，会自动起 dev server）
npm run test:all          # 全部
```

## 目录结构

```
src/          页面与组件
e2e/          Playwright 端到端测试
scripts/      API 集成测试脚本
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 后端地址，默认 `http://localhost:6133` |
