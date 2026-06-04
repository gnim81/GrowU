> [English](developer-guide.md) | [简体中文](developer-guide.zh-CN.md)
>
> [README](../README.zh-CN.md) · [贡献指南](../CONTRIBUTING.zh-CN.md) · [Docker 部署](docker-deployment.zh-CN.md) · [本地开发环境](local-dev-setup.zh-CN.md)

# 开发者指南

本文档面向公开发布后参与 成长优册（GrowU） 开发的维护者、贡献者和 AI 工具。它描述了当前架构、关键业务规则以及定义产品持久行为的文件。

## 项目概览

成长优册（GrowU） 是一个单一仓库的 Next.js 应用，用于追踪孩子的正向强化、积分变化和奖励兑换。它使用服务端渲染的 App Router 前端、Server Actions 处理写操作、Prisma 持久化数据、PostgreSQL 作为系统记录存储。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## 核心账户模型

成长优册（GrowU） 现在使用基于数据库的 `UserAccount` 记录，而非环境变量定义的账户列表。

关键文件：

- `src/lib/accounts.ts`
- `src/app/setup/page.tsx`
- `src/app/(app)/settings/accounts/page.tsx`
- `src/app/login/page.tsx`

当前行为：

- 在空数据库上，`/setup` 创建初始管理员账户。
- 用户在 `/login` 登录。
- 管理员在 `/settings/accounts` 管理账户。
- 系统必须始终保留至少一个已启用的管理员账户。
- `GROWU_ACCOUNTS` 仅作为升级时的旧版导入源保留。

## 架构说明

### 应用入口点

- `src/app/setup/page.tsx`：首次运行的管理员创建
- `src/app/login/page.tsx`：登录流程
- `src/app/(app)/page.tsx`：仪表板
- `src/app/(app)/children/page.tsx`：孩子管理
- `src/app/(app)/items/page.tsx`：积分项目管理
- `src/app/(app)/transactions/page.tsx`：交易历史和筛选
- `src/app/(app)/transactions/[id]/page.tsx`：交易详情和修订历史
- `src/app/(app)/transactions/export/route.ts`：导出端点
- `src/app/(app)/stats/page.tsx`：报告

### 服务端写操作编排

- `src/app/actions.ts` 集中了大多数需要认证的写路径

新的变更操作应遵循相同的模式，除非有充分的理由创建单独的边界。

### 业务逻辑辅助模块

- `src/lib/accounts.ts`：账户验证、哈希处理、初始管理员创建、旧版导入、管理员保护规则
- `src/lib/transactions.ts`：交易标准化、奖励余额检查、修订快照
- `src/lib/csv.ts`：导出交易数据的 CSV 生成
- `src/lib/points.ts`：积分汇总和交易标注
- `src/lib/date-range.ts`：日期范围验证
- `src/lib/transaction-trends.ts`：趋势聚合

## 数据模型要点

完整 schema 请参见 `prisma/schema.prisma`。

### `UserAccount`

字段包括：

- `username`
- `displayName`
- `passwordHash`
- `role`
- `enabled`

角色目前包括 `ADMIN` 和 `PARENT`。

### `Child`

孩子不会通过正常的业务流程被硬删除，而是通过设置 `enabled=false` 禁用，以保证历史交易记录完整保留。

### `PointItem`

项目在正常流程中同样只能禁用不能删除。这保护了历史记录，同时允许 UI 隐藏无效选项而不改变过去的数据。

### `PointTransaction`

重要字段包括：

- `childId`
- `type`
- `itemId`
- `itemNameSnapshot`
- `points`
- `note`
- `occurredAt`
- `createdByUsername`

`itemNameSnapshot` 是一个有意的历史快照。请勿将其替换为仅依赖当前项目名称的显示逻辑。

### `TransactionRevision`

编辑操作通过 `TransactionRevision` 审计，其中存储了编辑前后的快照以及编辑元数据。

## 不可偏离的业务规则

- 孩子在正常产品流程中只能禁用，不能硬删除。
- 积分项目在正常产品流程中只能禁用，不能硬删除。
- 奖励兑换如果会导致余额低于零，则必须失败。
- 惩罚交易可以将余额降至零以下。
- 交易历史必须保留 `itemNameSnapshot` 以保证历史可读性。
- 交易编辑必须通过 `TransactionRevision` 写入修订历史。
- 账户系统必须保持至少一个启用的管理员。
- CSV 导出应在生成的文件中保留可读的中文内容。

## 命令

```bash
npm run prisma:generate
npm run typecheck
npm test
npm run build
```

## 仅限本地的产物

以下位置是本地规划或工具产物，不应作为公开发布文档：

- `docs/superpowers`
- `.codegraph`
- `.deepseek`

它们仅限本地使用，通过 `.git/info/exclude` 排除。请勿将它们提交到公开的 Pull Request 中。

在关联的 worktree 中，实际的 exclude 文件可能位于公共 Git 目录中，而非 worktree 的 `.git` 指针文件。如需查找确切的本地路径，可使用 `git rev-parse --git-common-dir`。

## 贡献者指南

- 在修改账户、交易或导出行为之前，请先阅读本指南。
- 优先扩展现有辅助模块，而非在页面组件中重复实现业务规则。
- 除非产品明确变更，否则保持数据保留规则不变。
- 在记录或修改认证相关逻辑时，应反映当前的 `UserAccount` 模型，而非旧版基于环境变量的导入路径。
