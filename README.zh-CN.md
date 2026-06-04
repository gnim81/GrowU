# GrowU

> [English](README.md) | [简体中文](README.zh-CN.md)
>
> 其他文档：[贡献指南](CONTRIBUTING.zh-CN.md) · [安全策略](SECURITY.zh-CN.md) · [Docker 部署](docs/docker-deployment.zh-CN.md) · [云部署](docs/cloud-deployment.zh-CN.md) · [升级指南](docs/upgrading.zh-CN.md) · [本地开发环境](docs/local-dev-setup.zh-CN.md) · [开发者指南](docs/developer-guide.zh-CN.md) · [GrowU V1 规划](docs/growu-v1-plan.zh-CN.md)

GrowU 是一个面向孩子的正向强化进度与积分追踪工具。家长或监护人可管理孩子档案、定义积分项目、记录奖励或惩罚事件、兑换奖励、查看交易历史以及导出 CSV 报表，所有历史数据均得以保留。

本仓库为公开发布的英文草稿。维护者计划后续发布中文翻译文档。

## 功能特性

- 基于数据库的用户账户，支持角色分配与账户管理
- 首次运行时在 `/setup` 创建管理员
- 在 `/login` 登录
- 孩子档案，仅支持禁用不可删除，以保留历史记录
- 奖励、惩罚和兑换项目管理，仅支持禁用不可删除
- 交易历史记录，通过 `itemNameSnapshot` 保留项目名称快照
- 奖励兑换时的余额校验
- 通过 `TransactionRevision` 记录交易编辑历史
- CSV 导出交易数据，导出的文件中中文内容可正常阅读

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Docker 快速开始

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置以下必需值：

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_COOKIE_SECURE`

使用显式的 `DATABASE_URL`。如果数据库密码包含保留 URI 字符（如 `@`、`:`、`/`、`?` 或 `#`），请对密码部分进行 URL 编码后再放入连接字符串。

3. 启动整个栈：

```bash
docker compose up --build
```

4. 打开应用并完成首次设置：

- 访问 `http://localhost:3000/setup`
- 创建初始管理员账户
- 在 `http://localhost:3000/login` 登录

详细 Docker 指南：[docs/docker-deployment.zh-CN.md](docs/docker-deployment.zh-CN.md)

## 非 Docker 开发与部署

安装依赖：

```bash
npm install
```

在 `.env` 中设置 `DATABASE_URL` 和 `AUTH_SECRET`，然后执行迁移：

```bash
npm run prisma:deploy
```

启动开发服务器：

```bash
npm run dev
```

或者构建并运行生产模式：

```bash
npm run build
npm run start
```

在新数据库上，请先访问 `/setup` 创建初始管理员账户。

## 文档

- [Docker 部署指南](docs/docker-deployment.zh-CN.md)
- [云部署指南](docs/cloud-deployment.zh-CN.md)
- [升级指南](docs/upgrading.zh-CN.md)
- [本地开发环境搭建](docs/local-dev-setup.zh-CN.md)
- [开发者指南](docs/developer-guide.zh-CN.md)
- [GrowU V1 规划](docs/growu-v1-plan.zh-CN.md)

## 账户说明

- GrowU 现在使用基于数据库的 `UserAccount` 记录。
- 当系统中没有任何账户时，通过 `/setup` 创建第一个账户。
- 管理员账户管理可在 `/settings/accounts` 进行。
- 请始终保持至少有一个启用的管理员账户。
- 旧版通过环境变量定义的账户仅用于升级导入，需通过 `GROWU_ACCOUNTS` 和 `npm run migrate:legacy-accounts` 操作。