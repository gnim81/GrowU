> [English](docker-deployment.md) | [简体中文](docker-deployment.zh-CN.md)
>
> [README](../README.zh-CN.md) · [云部署](cloud-deployment.zh-CN.md) · [升级指南](upgrading.zh-CN.md) · [本地开发环境](local-dev-setup.zh-CN.md)

# Docker 部署

本文档介绍如何使用项目中自带的 `Dockerfile`、`compose.yaml` 和 `.env.example` 进行 GrowU 的 Docker 部署。

## 环境要求

- 已安装 Compose 插件的 Docker Engine
- 可写的主机环境，用于编写 `.env` 文件
- 用于身份验证的强随机密钥（非占位符）
- 通过 `DATABASE_URL` 显式提供的 PostgreSQL 连接字符串

附带的 Compose 配置会同时启动应用和 PostgreSQL。即使在这种配置下，您仍必须显式提供 `DATABASE_URL`。

## 环境变量

首先复制模板：

```bash
cp .env.example .env
```

在启动之前设置以下值：

- `POSTGRES_PASSWORD`：PostgreSQL 容器必需
- `DATABASE_URL`：Prisma 和运行时必需
- `AUTH_SECRET`：会话签名必需
- `AUTH_COOKIE_SECURE`：HTTPS 下设为 `true`，仅本地 HTTP 测试时可设为 `false`
- `GROWU_ACCOUNTS`：可选，仅用于升级时导入旧版环境变量配置的账户

示例格式：

```env
POSTGRES_PASSWORD="replace-with-a-strong-database-password"
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@db:5432/growu?schema=public"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
AUTH_COOKIE_SECURE="false"
GROWU_ACCOUNTS=""
```

部署前请替换每个示例值，不要在 `.env` 中保留生产环境占位符密钥。

如果数据库密码包含保留 URI 字符（如 `@`、`:`、`/`、`?`、`#`、`&` 或 `%`），请在放入 `DATABASE_URL` 前对密码部分进行 URL 编码。

## 启动栈

```bash
docker compose up --build
```

应用容器会依次执行：

1. `npm run prisma:deploy`
2. `npm run migrate:legacy-accounts`
3. `npm run start -- --hostname 0.0.0.0 --port 3000`

在浏览器中打开 `http://localhost:3000` 访问应用。

## 首次运行

全新安装且数据库中没有账户时：

1. 访问 `/setup`
2. 创建初始管理员账户
3. 在 `/login` 登录
4. 今后在 `/settings/accounts` 管理账户

GrowU 要求至少有一个启用的管理员账户。请勿禁用最后一个启用的管理员。

## 停止栈

停止并移除容器，同时保留数据库卷：

```bash
docker compose down
```

停止并移除容器及命名卷（有意重置时使用）：

```bash
docker compose down -v
```

仅在确实要删除已存储的 PostgreSQL 数据时使用 `-v`。

## 数据库迁移

启动时已自动执行 `npm run prisma:deploy`。如果想在应用容器内手动执行迁移：

```bash
docker compose run --rm app npm run prisma:deploy
```

如果您在升级后手动验证部署，应在首次流量到达前执行该命令。

## 旧版账户迁移

旧版通过环境变量配置的账户仅支持升级场景。

如果您正在从 `GROWU_ACCOUNTS` 导入：

1. 在 `.env` 中设置 `GROWU_ACCOUNTS`
2. 启动栈
3. 应用容器会执行 `npm run migrate:legacy-accounts`
4. 验证导入的用户可以在 `/login` 登录
5. 导入成功后从 `.env` 中移除 `GROWU_ACCOUNTS`

全新安装时，将 `GROWU_ACCOUNTS` 留空，并使用 `/setup` 创建账户。

## 备份与恢复

升级前请备份 PostgreSQL 数据库。

备份示例：

```bash
docker compose exec -T db pg_dump -U growu -d growu > growu-backup.sql
```

恢复到替换后的数据库的示例：

```bash
docker compose exec -T db psql -U growu -d growu < growu-backup.sql
```

如需完整回滚，请同时保留：

- 数据库备份
- 之前的应用镜像或提交引用

## 故障排查

### 应用启动失败

查看日志：

```bash
docker compose logs app
```

常见原因：

- `DATABASE_URL` 缺失
- `AUTH_SECRET` 缺失
- `DATABASE_URL` 中嵌入的密码未进行 URL 编码
- 未替换占位符密钥

### 数据库连接错误

检查：

- `POSTGRES_PASSWORD` 和 `DATABASE_URL` 中的实际密码是否一致
- `DATABASE_URL` 指向正确的主机和数据库名
- 连接字符串中包含 `?schema=public`

对于附带的 Compose 配置，`DATABASE_URL` 中的主机通常应为 `db`。

### `/setup` 立即重定向

说明数据库中已存在账户。请在 `/login` 登录，或者如果您期望的是全新安装，请检查数据库。

### 旧版导入未创建用户

检查：

- `GROWU_ACCOUNTS` 包含有效的 JSON
- 账户具有非空的 `username`、`displayName` 和 `passwordHash`
- 数据库中尚未包含账户

如果已存在账户，导入会被有意跳过。
