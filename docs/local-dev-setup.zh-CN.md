> [English](local-dev-setup.md) | [简体中文](local-dev-setup.zh-CN.md)
>
> [README](../README.zh-CN.md) · [Docker 部署](docker-deployment.zh-CN.md) · [云部署](cloud-deployment.zh-CN.md) · [开发者指南](developer-guide.zh-CN.md)

# 本地开发环境搭建

本文档介绍不使用 Docker 的本地开发环境搭建。假设您将在本地运行 PostgreSQL，并直接从仓库启动 Next.js 应用。

## 1. 安装 PostgreSQL

使用您偏好的包管理器或操作系统对应的官方安装程序安装 PostgreSQL。

请确认：

- PostgreSQL 已安装
- 服务器正在运行
- `psql` 命令可在 shell 路径中访问

## 2. 创建本地数据库和用户

创建一个数据库和一个专用用户，使用您自己生成的密码。SQL 示例：

```sql
CREATE USER growu WITH PASSWORD 'replace-with-your-generated-local-password';
CREATE DATABASE growu OWNER growu;
```

如果您的密码包含保留 URI 字符（如 `@`、`:`、`/`、`?` 或 `#`），请在放入 `DATABASE_URL` 前对密码部分进行 URL 编码。

## 3. 创建 `.env`

复制模板：

```bash
cp .env.example .env
```

然后编辑 `.env`，至少设置以下内容：

```env
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu?schema=public"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
AUTH_COOKIE_SECURE="false"
GROWU_ACCOUNTS=""
```

在普通的本地 HTTP 开发中，保持 `AUTH_COOKIE_SECURE=false`。

该设置也适用于通过 HTTP 进行的移动端或局域网测试。如果之后在本地通过 HTTPS 测试，可将其切换为 `true`。

## 4. 安装依赖

本项目在 `package.json` 中固定了依赖的精确版本（不使用 `^` 范围），并随仓库提交了 `package-lock.json`。请使用以下任一命令安装依赖，两者都会遵循锁定的版本。

```bash
npm ci        # 推荐：严格按照锁文件记录的版本安装
# 或
npm install   # 也可以；npm 默认会遵循已提交的锁文件
```

> **不要执行 `npm install <包名>@latest` 或 `npm update`。** 依赖被锁定在本项目构建和测试所基于的版本上。升级主版本（例如 `tailwindcss` v3 → v4，或 `next` 15 → 16）会导致构建失败，因为代码是为已锁定的主版本编写的。如果确实需要升级，请将其视为一次专门的迁移任务，并有意地更新锁文件。

### Node.js 版本

本项目目标版本为 Node.js 24（见 `.nvmrc`）。如果你使用 Node 版本管理工具，请在安装依赖前运行 `nvm use` 切换到预期版本。

## 5. 执行数据库迁移

```bash
npm run prisma:deploy
```

## 6. 启动开发服务器

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 7. 首次运行设置

在新的本地数据库上：

1. 访问 `/setup`
2. 创建初始管理员账户
3. 在 `/login` 登录

在正常开发中，请勿通过环境变量配置本地账户。`GROWU_ACCOUNTS` 仅用于升级导入测试。

## 8. 可选：本地生产模式检查

如果想在本地测试生产构建：

```bash
npm run build
npm run start
```
