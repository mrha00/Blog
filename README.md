# BlogApi

ASP.NET Core 8 博客后端 API：JWT 认证、文章/分类/标签 CRUD、分页搜索、评论回复、文件上传、浏览量防刷与详情缓存。

仓库：[https://github.com/mrha00/Blog](https://github.com/mrha00/Blog)

## 功能

| 模块 | 能力 |
|------|------|
| 认证 | 注册、登录、JWT、`/api/auth/me` |
| 文章 | CRUD、发布/草稿、分页、关键词/分类/标签筛选 |
| 分类 / 标签 | 查询；写操作需 Admin |
| 评论 | 发表、回复、嵌套列表、软删除 |
| 上传 | 图片上传（jpg/png，5MB，Magic Number 校验） |
| 浏览量 | 同 IP 1 小时内只计 1 次 |
| 缓存 | 文章详情 10 分钟；更新/删除后失效 |

## 技术栈

- .NET 8 / ASP.NET Core Web API
- Entity Framework Core + SQLite
- JWT Bearer
- `IDistributedCache`（内存或 Redis）
- Swagger / OpenAPI
- Docker / docker-compose（API + Redis）

## 项目结构

```
BlogApi/
├── BlogApi.API/
├── BlogApi.Services/
├── BlogApi.Infrastructure/
├── BlogApi.Core/
├── Scripts/
├── Dockerfile
└── docker-compose.yml
```

Controller 只注入 Service，不直接访问 `DbContext`。

## 环境要求

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)（或 `global.json` 中 SDK 9+ + rollForward）
- 可选：[Docker Desktop](https://www.docker.com/products/docker-desktop/)

## 本地运行

### 1. 克隆与配置

```bash
git clone https://github.com/mrha00/Blog.git
cd Blog
```

```bash
# Windows
copy BlogApi.API\appsettings.Development.example.json BlogApi.API\appsettings.Development.json
```

编辑 `BlogApi.API/appsettings.Development.json`，将 `Jwt:Key` 设为至少 32 字符的随机字符串。

### 2. 数据库

启动时会自动执行 EF 迁移。也可手动：

```bash
dotnet ef database update --startup-project BlogApi.API --project BlogApi.Infrastructure
```

### 3. 测试账号（开发）

```bash
dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
```

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | Admin123! | Admin |

也可用 `POST /api/auth/register` 注册普通用户。

### 4. 启动

```bash
dotnet run --project BlogApi.API
```

Swagger：<http://localhost:6133/swagger>

## Docker 运行

### 1. 环境变量

```bash
copy .env.example .env
```

编辑 `.env` 中的 `JWT_KEY`（至少 32 字符）。未设置时 compose 使用内置开发默认值。

### 2. 启动

```bash
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| API / Swagger | <http://localhost:8080/swagger> |
| Redis | localhost:6379 |

SQLite 数据卷：`./data/blog.db`（首次启动自动迁移）。

### 3. 写入 Admin 种子（容器外执行一次）

```bash
dotnet run --project Scripts/DbExec -- data/blog.db Scripts/seed-test-data.sql
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `ConnectionStrings__Default` | SQLite，如 `Data Source=blog.db` 或 `Data Source=/data/blog.db` |
| `ConnectionStrings__Redis` | 非空则使用 Redis 缓存 |
| `Jwt__Key` | JWT 签名密钥（必填，≥32 字符） |
| `Jwt__Issuer` / `Jwt__Audience` | 默认 `BlogApi` |
| `ASPNETCORE_ENVIRONMENT` | `Development` 时启用 Swagger |

## 主要 API

| 模块 | 路径 |
|------|------|
| 认证 | `/api/auth` |
| 文章 | `/api/posts` |
| 分类 | `/api/categories` |
| 标签 | `/api/tags` |
| 评论 | `/api/comments` |
| 上传 | `/api/upload` → `{ code, message, data: { url } }` |

静态文件：`/uploads/{guid}.png`

## 验收脚本

```powershell
dotnet run --project BlogApi.API

.\Scripts\run-regression-24.ps1      # 全流程 24 步
.\Scripts\run-local-tests.ps1        # 阶段二～五
.\Scripts\run-phase6-tests.ps1       # 阶段六
```

也可用 VS Code / Rider 打开 `BlogApi.API/BlogApi.http` 手测。

## License

MIT
