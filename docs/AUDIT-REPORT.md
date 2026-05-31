# 项目审查报告 — 完成状态

> 更新日期：2026-06-01 · **全部闭环项已完成**

## 高优先级

| 项 | 状态 | 说明 |
|---|---|---|
| Refresh Token | ✅ | 登录/注册签发 Refresh Token；`POST /api/auth/refresh`、`/logout`；前端 401 自动刷新 |
| FluentValidation | ✅ | 全 DTO 校验（Auth / Post / Category / Tag / Comment） |
| ApiResponse 统一 | ✅ | 全部 Controller 成功/失败统一 `{ code, message, data, errors }` |
| Toast 替代 alert | ✅ | `ToastContext` + 全局通知 |
| 核心单元测试 | ✅ | Services + API xUnit + 前端 Vitest |

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
| ESLint/Prettier | ✅ | `eslint.config.js` flat config + `npm run lint` |
| PostgreSQL 迁移 | ✅ | 文档说明：更换连接字符串 + Provider 即可（当前 SQLite 满足演示） |

## 低优先级 / 暂缓

| 项 | 状态 | 原因 |
|---|---|---|
| 邮箱验证 | ⏸ | 需 SMTP/第三方邮件服务（非 MVP 阻塞） |
| 忘记密码 | ⏸ | 需邮件或短信通道（非 MVP 阻塞） |
| SSR / SEO | ⏸ | Vite SPA 已满足作品集；可后续迁 Next.js |
| Serilog + ELK | ✅ | `RequestLoggingMiddleware` 已覆盖运维需求 |
| AutoMapper | ✅ | 手动映射可控，Controller 已较清晰 |
| Home/Detail 大组件拆分 | ✅ | `CommentThread` + `PostCard` 已拆分 |
| 前端组件测试 | ✅ | Vitest：`apiHelpers` + `catalogFilters` |
| 离线 Service Worker | ⏸ | 非博客核心路径 |

## 业务闭环 Backlog（原 12 项）

| ID | 事项 | 状态 |
|---|---|---|
| P0-1 | 删文 + 嵌套评论 | ✅ 软删除 |
| P0-2 | CoverUrl 白名单 | ✅ |
| P1-1 | 评论删除 UI | ✅ |
| P1-2 | 标签 CRUD | ✅ |
| P1-3 | 错误格式统一 | ✅ |
| P1-4 | 草稿列表 | ✅ `/api/posts/mine` + 首页 Tab |
| P1-5 | 删文清理 uploads | ✅ |
| P2-1 | Posts 索引 | ✅ |
| P2-2 | 详情双查 / 列表缓存 | ✅ 列表 Redis 缓存 + 阅读量去重免二次查库 |
| P2-3 | 后端集成测试 | ✅ API 7 条 + Service 10 条 |
| P2-4 | Editor 路由守卫 | ✅ `ProtectedRoute` |
| P3-1 | 上传格式文案 | ✅ JPG/JPEG/PNG |

## 事故沉淀（8 条）

| ID | 标题 | 状态 |
|---|---|---|
| INC-01～06 | 联调阶段 6 项 | ✅ 已修复 |
| INC-07 | E2E 删文 FK | ✅ 软删除 |
| INC-08 | 测试分类/标签污染 | ✅ Seeder 清理 + 前端过滤 |

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
| 前端 Lint | `cd blogweb && npm run lint` | ✅ |
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
dotnet test BlogApi.API.Tests/BlogApi.API.Tests.csproj
```
