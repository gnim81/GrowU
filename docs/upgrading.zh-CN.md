> [English](upgrading.md) | [简体中文](upgrading.zh-CN.md)
>
> [README](../README.zh-CN.md) · [Docker 部署](docker-deployment.zh-CN.md) · [云部署](cloud-deployment.zh-CN.md) · [本地开发环境](local-dev-setup.zh-CN.md)

# 升级 GrowU

本文档适用于正在迁移到当前开源发布加固分支的现有 GrowU 部署。

## 开始之前

在进行任何更改之前，请备份以下内容：

- PostgreSQL 数据库
- 当前环境文件或密钥配置

如果使用 Docker，还请记录当前镜像标签或提交引用，以便快速回滚。

## 升级概览

当前 GrowU 使用基于数据库的 `UserAccount` 记录。旧版通过环境变量定义的账户仅作为一次性导入源保留，需通过 `GROWU_ACCOUNTS` 和 `npm run migrate:legacy-accounts` 操作。

全新安装应使用 `/setup`。从旧版账户升级的现有安装应一次性导入旧版账户，验证访问正常后移除 `GROWU_ACCOUNTS`。

## 标准 Node.js 升级路径

1. 更新代码：

```bash
git pull
```

2. 安装依赖：

```bash
npm install
```

3. 执行数据库迁移：

```bash
npm run prisma:deploy
```

4. 如果从旧版 `GROWU_ACCOUNTS` 升级，运行：

```bash
npm run migrate:legacy-accounts
```

5. 启动或重启应用，然后验证：

- `/login` 页面可加载
- 导入或已有的用户可以登录
- 管理员可以访问 `/settings/accounts`

6. 旧版导入成功后，从环境配置中移除 `GROWU_ACCOUNTS`。

## 旧版账户迁移详情

仅当您的现有部署仍通过 `GROWU_ACCOUNTS` 定义账户时才使用此方式。

推荐的执行顺序：

```bash
npm install
npm run prisma:deploy
npm run migrate:legacy-accounts
```

然后验证：

- 预期的用户存在于数据库中
- 登录功能在 `/login` 正常
- 至少有一个已启用的管理员账户

导入仅在空账户表中执行。如果已存在账户，导入会被有意跳过，以避免覆盖基于数据库的账户管理。

## Docker 升级路径

升级前：

1. 备份 PostgreSQL 卷或创建数据库转储
2. 备份 `.env`
3. 确认 `.env` 中包含以下变量的显式值：
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL`
   - `AUTH_SECRET`

`DATABASE_URL` 必须显式提供。如果嵌入的密码包含保留 URI 字符，请对该密码部分进行 URL 编码。

然后更新并重启：

```bash
docker compose up --build -d
```

启动时会执行：

- `npm run prisma:deploy`
- `npm run migrate:legacy-accounts`

容器健康后，验证：

- `/login` 正常响应
- 管理员登录正常
- 管理员可以访问 `/settings/accounts`

如果使用了 `GROWU_ACCOUNTS` 进行导入，验证后将其移除并重启栈。

## 回滚指南

如果升级失败：

1. 停止更新后的应用
2. 恢复之前的代码或镜像版本
3. 如果迁移或导入导致数据库状态不可用，恢复数据库备份
4. 恢复之前的环境配置
5. 启动之前的版本，验证登录和核心工作流

如果在升级过程中 schema 或账户数据发生变化，请勿在没有数据库备份的情况下尝试回滚。

## 升级后检查清单

- `/login` 正常工作
- 当账户已存在时，`/setup` 不再显示
- 管理员可以打开 `/settings/accounts`
- 至少有一个启用的管理员
- 交易、CSV 导出和历史数据仍然正确
- 导入成功后已移除 `GROWU_ACCOUNTS`
