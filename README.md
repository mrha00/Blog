# BlogApi

ASP.NET Core 8 博客后端 API：JWT 认证、文章/分类/标签 CRUD、分页搜索、评论回复、文件上传、浏览量防刷与详情缓存。

仓库地址：[https://github.com/mrha00/Blog](https://github.com/mrha00/Blog)

## 技术栈

- .NET 8 / ASP.NET Core Web API
- Entity Framework Core + SQLite
- JWT Bearer 认证
- `IDistributedCache`（默认内存；可配置 Redis）
- Swagger / OpenAPI

## 项目结构

```
BlogApi/
├── BlogApi.API/           # 控制器、DTO、校验、中间件
├── BlogApi.Services/      # 业务逻辑
├── BlogApi.Infrastructure/# EF、仓储、文件存储
├── BlogApi.Core/          # 实体、接口、领域模型
├── Scripts/               # 测试数据 SQL、本地验收脚本
└── BlogApi.sln
```

**分层约定**：Controller 只注入 Service，不直接访问 `DbContext`。

## 环境要求

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)（或按 `global.json` 使用 SDK 9+ 并 `rollForward`）
- 可选：Redis（`ConnectionStrings:Redis` 非空时启用）

## 快速开始

### 1. 克隆与配置

```bash
git clone https://github.com/mrha00/Blog.git
cd Blog
```

复制开发配置（含 JWT 密钥，**勿提交真实密钥**）：

```bash
copy BlogApi.API\appsettings.Development.example.json BlogApi.API\appsettings.Development.json
```

编辑 `BlogApi.API/appsettings.Development.json`，将 `Jwt:Key` 改为至少 32 字符的随机字符串。

### 2. 数据库迁移

```bash
dotnet ef database update --startup-project BlogApi.API --project BlogApi.Infrastructure
```

将在 `BlogApi.API/` 下生成 `blog.db`（已在 `.gitignore` 中忽略）。

### 3. 测试数据（可选）

```bash
dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
```

默认管理员：`admin` / `Admin123!`

### 4. 运行

```bash
dotnet run --project BlogApi.API
```

开发环境 Swagger：<http://localhost:6133/swagger>

## 主要 API

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/auth` | register、login、me |
| 文章 | `/api/posts` | CRUD、publish、分页列表、详情、评论 |
| 分类 | `/api/categories` | 列表；写操作需 Admin |
| 标签 | `/api/tags` | 列表；写操作需 Admin |
| 评论 | `/api/comments` | 软删除 |
| 上传 | `/api/upload` | JWT；返回 `{ code, message, data: { url } }` |

上传文件通过 `wwwroot/uploads` 静态访问，例如 `/uploads/{guid}.png`。

## 本地验收脚本

```powershell
# 先启动 API
dotnet run --project BlogApi.API

# 另开终端
.\Scripts\run-local-tests.ps1    # 阶段二～五
.\Scripts\run-phase6-tests.ps1   # 阶段六（上传、浏览量、缓存）
```

## 不会提交到仓库的内容

- `blog.db` 及 SQLite 临时文件
- `BlogApi.API/appsettings.Development.json`（含 JWT 密钥）
- `wwwroot/uploads/` 下用户上传文件
- `bin/`、`obj/` 构建产物

## 开发进度

当前实现至 **阶段六**（上传、ViewCount、详情缓存）。Docker 与完整回归见本地 `task/` 文档（未纳入本仓库）。

## License

MIT（可按需修改）
