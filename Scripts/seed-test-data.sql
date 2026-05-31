-- BlogApi 演示账号（直接写入 blog.db）
-- 执行：dotnet run --project Scripts/DbExec -- BlogApi.API/blog.db Scripts/seed-test-data.sql
-- 统一密码：123456

DELETE FROM Users WHERE Username IN ('admin', 'alice', 'bob');

INSERT INTO Users (Username, Nickname, Email, PasswordHash, Role, CreatedAt)
VALUES
(
    'admin',
    '博客管理员',
    'admin@blog.local',
    '$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa',
    'Admin',
    datetime('now')
),
(
    'alice',
    '爱丽丝',
    'alice@blog.local',
    '$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa',
    'User',
    datetime('now')
),
(
    'bob',
    '小明',
    'bob@blog.local',
    '$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa',
    'User',
    datetime('now')
);
