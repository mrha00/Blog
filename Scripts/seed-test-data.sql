-- BlogApi 本地测试数据（直接写入 blog.db，不经过代码种子）
-- 执行方式见 Scripts/README.md
-- 密码 Admin123! 的 BCrypt 哈希（与 AuthService 校验方式一致）

DELETE FROM Users WHERE Username = 'admin';

INSERT INTO Users (Username, Email, PasswordHash, Role, CreatedAt)
VALUES (
    'admin',
    'admin@blog.local',
    '$2a$11$RhrTiMsoeHG0DsWEn2mt8eUQgDSADjfdq0zXaDz0Qgnz6UEnhYS7u',
    'Admin',
    datetime('now')
);

-- 后续测试数据在此文件末尾追加，例如分类、标签、文章等
