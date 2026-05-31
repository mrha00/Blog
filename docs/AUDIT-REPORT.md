# 项目审查报告 — 完成状态

> 更新日期：2026-06-01

## 高优先级

| 项 | 状态 | 说明 |
|---|---|---|
| Refresh Token | ✅ | 登录/注册签发 Refresh Token；`POST /api/auth/refresh`、`/logout`；前端 401 自动刷新 |
| FluentValidation | ✅ | 全 DTO 校验（Auth / Post / Category / Tag / Comment） |
| ApiResponse 统一 | ✅ | 全部 Controller 成功/失败统一 `{ code, message, data, errors }` |
| Toast 替代 alert | ✅ | `ToastContext` + 全局通知 |
| 核心单元测试 | ✅ | `BlogApi.Services.Tests`（UploadUrlValidator）+ API xUnit |

## 中优先级

| 项 | 状态 | 说明 |
|---|---|---|
| 文章软删除 | ✅ | `Post.IsDeleted` + 全局 QueryFilter；评论仍保留 |
| 评论软删除 | ✅ | 已有 `Comment.IsDeleted` |
| API 限流 | ✅ | 全站 120/min；认证接口 20/min（`auth` 策略） |
| React.lazy 代码分割 | ✅ | 页面级懒加载 + Suspense |
| types.ts 清理 | ✅ | 统一 camelCase；兼容层保留在 `apiHelpers` |
| JWT 环境变量 | ✅ | 生产/Docker 用 `JWT_KEY`；开发用 example 模板 |
| 请求日志 | ✅ | `RequestLoggingMiddleware` |
| Swagger XML 注释 | ✅ | `GenerateDocumentationFile` + IncludeXmlComments |
| .editorconfig | ✅ | 根目录统一缩进/编码 |
| GitHub Actions CI | ✅ | `.github/workflows/ci.yml` |
| ESLint/Prettier | ⏸ | 暂用 `tsc --noEmit`；可后续加 flat config |
| PostgreSQL 迁移 | ⏸ | 当前 SQLite + Docker；生产可换连接字符串 |

## 低优先级 / 暂缓

| 项 | 状态 | 原因 |
|---|---|---|
| 邮箱验证 | ⏸ | 需 SMTP/第三方邮件服务 |
| 忘记密码 | ⏸ | 需邮件或短信通道 |
| SSR / SEO | ⏸ | Vite SPA；可后续迁 Next.js |
| Serilog + ELK | ⏸ | 已有内置 Request 日志 |
| AutoMapper | ⏸ | 手动映射可控；Controller 已较清晰 |
| Home/Detail 大组件拆分 | 部分 | Detail 已拆 `CommentThread`；Home 可继续拆 `PostCard` |
| 前端组件测试 | ⏸ | 已有 E2E + 工具函数 Vitest |
| 离线 Service Worker | ⏸ | 非博客核心路径 |

## 安全加固

| 项 | 状态 |
|---|---|
| CoverUrl / AvatarUrl 白名单 | ✅ |
| 安全响应头 + CSP | ✅ `SecurityHeadersMiddleware` |
| 改密后吊销全部 Refresh Token | ✅ |
| 密码字段 UI（显示/隐藏） | ✅ `PasswordField` |

## 测试矩阵

| 类型 | 命令 | 状态 |
|---|---|---|
| 前端单元 | `cd blogweb && npm test` | ✅ |
| API 集成 | `npm run test:integration` | ✅ 32+ |
| E2E | `npm run test:e2e` | ✅ |
| 后端 API | `dotnet test BlogApi.API.Tests` | ✅ |
| 后端 Service | `dotnet test BlogApi.Services.Tests` | ✅ |

## 本地验证

```bash
# 后端
dotnet run --project BlogApi.API

# 前端
cd blogweb && npm run dev

# 全量测试
cd blogweb && npm run test:all
dotnet test BlogApi.Services.Tests/BlogApi.Services.Tests.csproj
```
