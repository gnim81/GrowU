[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md) — [README](README.zh-CN.md) · [安全策略](SECURITY.zh-CN.md)

# 参与 成长优册（GrowU） 贡献

感谢您为 成长优册（GrowU） 贡献。本指南概述了公开贡献的最低要求，以确保变更可审查、可复现且安全发布。

## 开发环境搭建

安装依赖并启动本地开发工作流：

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## 提交 Pull Request 前的准备

在请求审查之前，请运行标准检查：

```bash
npm run typecheck
npm test
npm run build
```

## Pull Request 指南

- 保持变更聚焦。优先提交目标明确的小型 Pull Request。
- 当业务规则、校验逻辑、访问控制或其他用户可见的行为发生变化时，请添加或更新测试。
- 当行为、配置、环境搭建或部署预期发生变化时，请更新文档。
- 在 Pull Request 中描述任何 schema、环境或发布相关的考量。

## 公开贡献安全注意事项

请勿在提交、Issue、Pull Request、截图或生成产物中包含以下内容：

- 凭证、密钥、令牌、密码或连接字符串
- 个人数据或其他敏感的、真实世界的记录
- 本地规划文档，包括仅为内部工作流保留的内容
- 并非用于公共仓库的生成工具产物

如果不确定某内容是否适合公开发布，请先将其移除。如怀疑存在安全漏洞，请遵循安全策略中的指引，而非创建公开 Issue。
