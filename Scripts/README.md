# 测试数据脚本

测试账号与业务数据**直接写入 SQLite**，不在代码里做种子。

## 执行

在 `task/BlogApi` 目录下：

```bash
dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
```

也可使用 sqlite3 或 DB Browser for SQLite 打开 `BlogApi.API/blog.db` 手动执行 SQL。

## 默认 Admin

| 字段 | 值 |
|------|-----|
| Username | admin |
| Password | Admin123! |
| Role | Admin |

## 新增测试数据

1. 编辑 `seed-test-data.sql`，在文件末尾追加 `INSERT` 语句  
2. 重新执行上面的命令（或只在 DB 工具里运行新增 SQL）  
3. 用户密码须为 BCrypt 哈希；可用 Swagger 注册接口生成，或临时运行：

```bash
dotnet run --project Scripts/SeedHash -- "YourPassword"
```

（若保留 `Scripts/SeedHash` 小工具；否则用 `POST /api/auth/register` 注册即可。）

## 注意

- `blog.db` 路径相对于 API 项目运行时的工作目录，一般为 `BlogApi.API/blog.db`
- 勿将含真实密码的脚本提交到公开仓库（本地练习可忽略）
