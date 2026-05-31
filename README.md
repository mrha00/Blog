# Blog — 全栈博客系统

[![.NET](https://img.shields.io/badge/.NET-8-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**仓库**：[github.com/mrha00/Blog](https://github.com/mrha00/Blog)

## 项目简介

Blog 是一个**前后端分离的全栈博客平台**，覆盖读者浏览、作者创作、管理员运维三类角色。用户可注册登录、发布 Markdown 文章、上传封面、管理草稿，并在文章下进行嵌套评论；管理员可维护分类与标签。

后端采用 **ASP.NET Core 8 四层架构**（API → Services → Infrastructure → Core），前端为 **React + Vite SPA**（`blogweb/`），通过 JWT 与 REST API 联调。项目包含单元测试、API 集成脚本、Playwright E2E 与后端 xUnit，适合作为**全栈工程化实践**的面试展示项目。

| | |
|---|---|
| **前端** | http://localhost:3000（`blogweb/`） |
| **API / Swagger** | http://localhost:6133/swagger |
| **演示账号** | `admin` / `alice` / `bob`，密码均为 `123456` |

## 仓库结构

| 目录 | 说明 |
|------|------|
| `BlogApi.*` | 后端 REST API（四层架构） |
| `blogweb/` | 前端 SPA（React + Vite + Tailwind） |
| `Scripts/` | 数据库脚本与工具 |

## 核心功能

**读者侧**：首页搜索 / 分类 / 标签筛选、文章详情、阅读量、嵌套评论  
**作者侧**：编辑器、封面图上传、草稿 / 发布、我的草稿列表、个人资料（头像 / 昵称 / 改密）  
**管理侧**：分类 CRUD、标签增删改（Admin）  
**工程能力**：JWT + Refresh Token、FluentValidation、统一 ApiResponse、API 限流、请求日志、Redis 缓存、Docker 部署

## 项目亮点

- **全栈闭环**：注册/登录 → 写文章 → 发布 → 评论回复 → 管理分类标签
- **分层后端**：Controller 仅编排，业务在 Service，数据访问在 Repository
- **工程化细节**：CoverUrl 白名单、文章/评论软删除、分页筛选、列表缓存、安全响应头
- **测试体系**：Vitest 单元 + Node 集成脚本 + Playwright E2E + xUnit（API + Service）
- **可部署**：Docker Compose（API + Redis），SQLite 持久化

## 技术栈

**后端**：ASP.NET Core 8 · EF Core · SQLite · JWT · Redis · Swagger · Docker  
**前端**：React 19 · TypeScript · Vite · Tailwind · React Router · Playwright

## 架构

```mermaid
flowchart LR
    Web[blogweb :3000]
    API[BlogApi :6133]
    DB[(SQLite)]
    Redis[(Redis)]

    Web -->|REST + JWT| API
    API --> DB
    API --> Redis
```

## 快速开始（本地联调）

**环境**：.NET 8 SDK、Node.js 18+

```bash
git clone https://github.com/mrha00/Blog.git
cd Blog

# 1. 后端
copy BlogApi.API\appsettings.Development.example.json BlogApi.API\appsettings.Development.json
dotnet run --project BlogApi.API

# 2. 前端（新终端）
cd blogweb
npm install
copy .env.example .env.local
npm run dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| API / Swagger | http://localhost:6133/swagger |
| 健康检查 | http://localhost:6133/health |

| 演示账号 | 密码 | 角色 |
|---------|------|------|
| admin | 123456 | Admin |
| alice | 123456 | User |
| bob | 123456 | User |

可选：写入演示数据

```bash
dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
```

## 测试

```bash
cd blogweb
npm run test:all
```

后端 xUnit（WebApplicationFactory，无需启动 API）：

```bash
dotnet test BlogApi.API.Tests/BlogApi.API.Tests.csproj
```

（`npm run test:integration` / E2E 需后端在 6133 端口运行。）

## API 概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 注册、登录、Refresh Token、退出、个人资料、改密 |
| 文章 | `/api/posts` | CRUD、发布/草稿、我的草稿 `/mine` |
| 分类 | `/api/categories` | 列表；管理需 Admin |
| 标签 | `/api/tags` | 列表/增删改；管理需 Admin |
| 评论 | `/api/posts/{id}/comments` | 发表、嵌套回复 |
| 上传 | `/api/upload` | 封面/头像（jpg/png，≤5MB，仅存 `/uploads/`） |

**CORS**：`appsettings.Development.example.json` 已包含 `http://localhost:3000`。

## Docker（仅 API，可选）

```bash
copy .env.example .env
docker compose up --build
```

## 详细文档

- 前端：[`blogweb/README.md`](blogweb/README.md)
- 审查报告：[`docs/AUDIT-REPORT.md`](docs/AUDIT-REPORT.md)

## License

[MIT](LICENSE)
