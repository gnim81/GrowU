# GrowU 开发与排障指南

本文档面向后续开发者和 AI 工具，目标是快速说明当前代码结构、关键业务规则、运行方式、已知约束和常见故障排查入口。

## 1. 项目定位

GrowU 是一个家庭积分管理 Web App，面向家长使用。核心能力：

- 固定账号登录
- 孩子档案管理
- 加分、减分、兑换项目管理
- 积分流水记录与修改审计
- 流水筛选、趋势图、统计汇总、CSV 导出

当前项目是单仓库 Next.js 全栈应用，不拆前后端。

## 2. 技术栈与运行方式

- Web 框架：`Next.js App Router`
- 语言：`TypeScript`
- 样式：`Tailwind CSS`
- 数据库：`PostgreSQL`
- ORM：`Prisma`
- 认证：自定义固定账号 + Cookie Session

关键命令见 [README.md](G:\Workspace\GrowU\README.md)。

当前 `package.json` 中需要注意：

- `npm run build`：只执行 `next build`
- `npm run build:full`：执行 `prisma generate && next build`

这样设计是为绕开 Windows 上 Prisma DLL 经常被占用导致 `prisma generate` 失败的问题。只有当 `prisma/schema.prisma` 变化时才需要跑 `build:full`。

## 3. 目录结构

### 3.1 页面入口

- [src/app/login/page.tsx](G:\Workspace\GrowU\src\app\login\page.tsx)
  登录页
- [src/app/(app)/layout.tsx](G:\Workspace\GrowU\src\app\(app)\layout.tsx)
  登录后主布局、桌面/移动导航
- [src/app/(app)/page.tsx](G:\Workspace\GrowU\src\app\(app)\page.tsx)
  首页
- [src/app/(app)/children/page.tsx](G:\Workspace\GrowU\src\app\(app)\children\page.tsx)
  孩子档案
- [src/app/(app)/items/page.tsx](G:\Workspace\GrowU\src\app\(app)\items\page.tsx)
  项目管理
- [src/app/(app)/transactions/page.tsx](G:\Workspace\GrowU\src\app\(app)\transactions\page.tsx)
  流水回溯 + 趋势图
- [src/app/(app)/stats/page.tsx](G:\Workspace\GrowU\src\app\(app)\stats\page.tsx)
  统计页

### 3.2 服务端动作

- [src/app/actions.ts](G:\Workspace\GrowU\src\app\actions.ts)

这里集中处理：

- 登录与退出
- 档案/项目新增、更新与停用
- 流水创建与修改
- 写入后的页面刷新

后续如新增写操作，优先延续这里的模式，不要把数据库写入逻辑分散到多个页面组件中。

### 3.3 业务工具

- [src/lib/auth.ts](G:\Workspace\GrowU\src\lib\auth.ts)
  固定账号认证、Cookie Session
- [src/lib/prisma.ts](G:\Workspace\GrowU\src\lib\prisma.ts)
  Prisma 单例
- [src/lib/points.ts](G:\Workspace\GrowU\src\lib\points.ts)
  积分方向、余额、首页卡片聚合
- [src/lib/date-range.ts](G:\Workspace\GrowU\src\lib\date-range.ts)
  日期区间解析与 1 年范围校验
- [src/lib/date-presets.ts](G:\Workspace\GrowU\src\lib\date-presets.ts)
  快捷日期区间
- [src/lib/transaction-trends.ts](G:\Workspace\GrowU\src\lib\transaction-trends.ts)
  趋势图采样、补点、多孩子曲线计算

### 3.4 组件

- [src/components/transaction-form.tsx](G:\Workspace\GrowU\src\components\transaction-form.tsx)
  记分/兑换表单
- [src/components/transaction-choice-fields.tsx](G:\Workspace\GrowU\src\components\transaction-choice-fields.tsx)
  孩子/项目标签式选择
- [src/components/points-trend-chart.tsx](G:\Workspace\GrowU\src\components\points-trend-chart.tsx)
  趋势图 SVG 组件
- [src/components/date-preset-links.tsx](G:\Workspace\GrowU\src\components\date-preset-links.tsx)
  快捷日期区间按钮
- [src/components/ui.tsx](G:\Workspace\GrowU\src\components\ui.tsx)
  轻量通用 UI 组件

## 4. 数据模型

Prisma Schema 在 [prisma/schema.prisma](G:\Workspace\GrowU\prisma\schema.prisma)。

### 4.1 `Child`

孩子档案：

- `name`
- `displayColor`
- `avatarText`
- `enabled`
- `sortOrder`

### 4.2 `PointItem`

积分项目：

- `type`: `BONUS | PENALTY | REWARD`
- `name`
- `defaultPoints`
- `description`
- `enabled`
- `sortOrder`

### 4.3 `PointTransaction`

积分流水：

- `childId`
- `type`
- `itemId`
- `itemNameSnapshot`
- `points`
- `note`
- `occurredAt`
- `createdByUsername`

`itemNameSnapshot` 很关键。项目停用或改名后，历史流水仍依赖这个快照显示创建流水时保存的项目名称。

### 4.4 `TransactionRevision`

流水修改审计：

- `transactionId`
- `beforeData`
- `afterData`
- `reason`
- `editedByUsername`

## 5. 当前业务规则

### 5.1 登录

- 账号来自 `.env` 的 `GROWU_ACCOUNTS`
- 不存在后台用户管理
- 密码哈希格式为 `pbkdf2.iterations.salt.hash`
- 不使用 `$` 分隔，避免 Next `.env` 加载器把 `$...` 当环境变量展开

### 5.2 Cookie

- `AUTH_COOKIE_SECURE=true`：仅适合 HTTPS
- `AUTH_COOKIE_SECURE=false`：适合本机或局域网 HTTP 调试

如果手机能登录但提交后跳回登录页，优先检查这个配置。

### 5.3 积分规则

- 加分存正数
- 减分存负数
- 兑换存负数
- 兑换不允许透支
- 减分允许导致总分为负

### 5.4 数据保留规则

- 孩子档案在正常 UI 中通过 `enabled=false` 停用，不提供硬删除。
- 停用孩子后，该孩子不再出现在新增流水的默认选择中。
- 孩子的历史流水与流水修订记录必须保持可查询。
- 积分项目在正常 UI 中通过 `enabled=false` 停用，不提供硬删除。
- 停用项目后，该项目不再出现在新增流水的项目选择中。
- 历史流水显示项目名称时依赖 `PointTransaction.itemNameSnapshot`，不要改成只依赖实时 `PointItem.name`。

### 5.5 趋势图规则

- 默认展示累计积分曲线，不是单日增量柱状图
- “全部孩子”时按孩子分多条线
- 选择具体孩子时只显示一条线
- “类型=全部”显示总积分变化
- “类型=具体值”显示该类型积分累计变化
- 采样点数量目标为 10 到 20 个
- 无变化日期也会补点
- 最大区间 1 年

## 6. 页面与数据流

### 6.1 首页

- 通过 `getChildCards()` 聚合当前积分、今日变化、本周变化
- 首页按钮跳到对应的记分/兑换/流水页面

### 6.2 孩子档案 / 项目管理

- 左侧是列表，右侧是详情
- 详情区依赖 `key` 重新挂载表单，否则切换列表项时 `defaultValue` 不会刷新

如果以后出现“左侧点了但右侧内容不变”，优先检查组件 `key` 是否丢失。

### 6.3 流水与统计

- 查询参数通过 `searchParams` 传递
- `validateDateRange()` 负责限制区间
- `buildTrendChartData()` 负责图表采样
- 流水详情页支持修改并记录审计

## 7. 后续扩展建议

如果后续要继续扩展，优先按下面原则做：

- 新增写操作：放在 `src/app/actions.ts`
- 新增聚合规则：放在 `src/lib/*.ts`
- 新增通用表单或图表：放在 `src/components/*.tsx`
- 数据库字段变更：先改 `prisma/schema.prisma`，再跑 `npm run prisma:migrate` 或生成迁移
- 如果改了 schema，本地验证优先跑 `npm run build:full`

## 8. 常见故障排查

### 8.1 `npm run build` 卡住

常见原因：

- 旧的 `next start` 或 `next build` 进程还在占用 `.next`

排查思路：

- 先关闭 GrowU 相关 `node/cmd` 进程
- 再重新执行 `npm run build`

### 8.2 `prisma generate` 失败，提示 DLL 重命名或 `EPERM`

这是 Windows 常见问题，通常是 Prisma 引擎 DLL 被占用。

处理原则：

- 普通 UI 改动不要跑 `build:full`
- 只在 schema 变化后跑 `npm run prisma:generate` 或 `npm run build:full`

### 8.3 手机能登录但提交操作跳回登录页

优先检查：

- `.env` 中 `AUTH_COOKIE_SECURE=false`
- 服务是否用 HTTP 被手机访问
- 修改 `.env` 后是否重新构建并重启

### 8.4 登录始终失败

优先检查：

- `GROWU_ACCOUNTS` 是否是合法 JSON
- 密码哈希是否是 `pbkdf2.iterations.salt.hash`
- 是否误用了包含 `$` 的旧格式

### 8.5 停用或改名项目后历史流水显示异常

当前正确行为：

- 历史流水不依赖 `PointItem.name`
- 依赖 `PointTransaction.itemNameSnapshot`

如果以后停用或改名项目后历史流水名称变化或丢失，说明有代码错误地改成了实时 join 项目名。

## 9. AI 工具扩展建议

给后续 AI 的建议：

- 先读本文档，再读 [src/app/actions.ts](G:\Workspace\GrowU\src\app\actions.ts)、[prisma/schema.prisma](G:\Workspace\GrowU\prisma\schema.prisma)、[src/app/(app)/transactions/page.tsx](G:\Workspace\GrowU\src\app\(app)\transactions\page.tsx)
- 做 UI 改动前，确认是否会影响移动端底部导航和标签式选择
- 做数据保留逻辑改动前，先确认是否会破坏流水历史和审计
- 做图表改动前，先确认是“累计值”还是“区间增量”，两者语义不同
- 做认证改动前，先确认是否仍需支持局域网手机 HTTP 调试
