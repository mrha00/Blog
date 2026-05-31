# 测试数据

在 `BlogApi` 根目录执行：

```bash
dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
```

默认管理员：`admin` / `Admin123!`

密码须为 BCrypt 哈希时，可运行 `Scripts/SeedHash` 生成，或直接使用 Swagger 注册接口。
