# GrowU 成长优册

家庭自用的云端响应式积分管理 Web App。V1 用于管理多个孩子、加减分项目、兑换项目、积分流水、记录修改审计、统计和 CSV 导出。

## 技术栈

- Next.js + TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- 固定账号登录

## 本地准备

详细步骤见 [docs/local-dev-setup.md](docs/local-dev-setup.md)。

云端非 Docker 部署（Node.js + PostgreSQL + lighttpd）见 [docs/cloud-deployment.md](docs/cloud-deployment.md)。

面向后续开发与 AI 扩展的代码说明见 [docs/developer-guide.md](docs/developer-guide.md)。

复制环境变量文件：

```bash
cp .env.example .env
```

生成密码哈希：

```bash
npm run hash-password -- your-password
```

把输出结果填入 `.env` 的 `GROWU_ACCOUNTS`。哈希格式类似 `pbkdf2.310000.salt.hash`：

```json
[{"username":"admin","displayName":"管理员","passwordHash":"生成的哈希","enabled":true}]
```

## 开发命令

安装依赖：

```bash
npm install --no-audit --no-fund
```

生成 Prisma Client：

```bash
npm run prisma:generate
```

创建数据库迁移：

```bash
npm run prisma:migrate
```

部署已有迁移：

```bash
npm run prisma:deploy
```

启动开发服务：

```bash
npm run dev
```

构建：

```bash
npm run build
```

## 当前实现范围

- 固定账号登录与退出
- 首页积分概览
- 孩子新增、编辑、停用
- 加分、减分、兑换项目新增、编辑、停用
- 加分、减分、兑换流水创建
- 兑换余额不足拦截
- 流水列表、筛选、详情
- 流水修改审计
- 统计汇总
- CSV 导出

## 开发计划

完整 V1 开发计划和验收标准见 [docs/growu-v1-plan.md](docs/growu-v1-plan.md)。
