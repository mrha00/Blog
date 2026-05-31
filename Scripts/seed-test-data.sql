-- BlogApi 演示账号（直接写入 blog.db）
-- 执行：dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
-- 统一密码：123456

DELETE FROM Users WHERE Username IN ('admin', 'alice', 'bob');

INSERT INTO Users (Username, Email, PasswordHash, Role, CreatedAt)
VALUES
(
    'admin',
    'admin@blog.local',
    '$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa',
    'Admin',
    datetime('now')
),
(
    'alice',
    'alice@blog.local',
    '$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa',
    'User',
    datetime('now')
),
(
    'bob',
    'bob@blog.local',
    '$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa',
    'User',
    datetime('now')
);
