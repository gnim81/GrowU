> [English](cloud-deployment.md) | [简体中文](cloud-deployment.zh-CN.md)
>
> [README](../README.zh-CN.md) · [Docker 部署](docker-deployment.zh-CN.md) · [本地开发环境](local-dev-setup.zh-CN.md) · [升级指南](upgrading.zh-CN.md)

# 云部署

本文档介绍如何在云虚拟机或裸机上以非 Docker 方式部署 成长优册（GrowU）。示例使用 Ubuntu、Node.js、PostgreSQL、systemd 和 lighttpd，但同一应用可运行在任何能将请求转发至 Node.js 进程的反向代理之后。

## 部署模型

推荐的生产流程：

```text
Browser -> HTTPS reverse proxy -> GrowU Node.js service on 127.0.0.1:3000 -> PostgreSQL
```

正常运行时，请勿将应用端口直接暴露到公网。

## 环境要求

- Ubuntu 22.04 或 24.04 LTS，或其他提供等效软件包的 Linux 发行版
- Node.js 22 LTS 或更新版本
- PostgreSQL
- 进程管理器，如 systemd
- 反向代理，如 lighttpd、Nginx、Caddy 或云负载均衡器
- HTTPS（生产环境必需）

## 安装基础包

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git lighttpd postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
```

验证：

```bash
node --version
npm --version
systemctl status postgresql
systemctl status lighttpd
```

## 创建 PostgreSQL 数据库

如果 PostgreSQL 运行在同一台服务器上：

```bash
sudo -u postgres psql
```

然后使用您自己生成的密码创建专门的数据库和用户：

```sql
CREATE USER growu WITH PASSWORD 'replace-with-a-strong-database-password';
CREATE DATABASE growu OWNER growu;
```

测试连接：

```bash
psql "postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu" -c "SELECT 1;"
```

`psql` 不使用 Prisma 的 `schema=public` 查询参数。该参数仅在应用的 `DATABASE_URL` 中添加。

如果您的 PostgreSQL 密码包含保留 URI 字符，请在放入连接字符串前对密码部分进行 URL 编码。

应用连接字符串示例：

```env
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu?schema=public"
```

对于托管型 PostgreSQL 服务，请使用提供商提供的主机、端口、数据库名和 SSL 设置。

## 获取应用代码

```bash
sudo mkdir -p /opt
cd /opt
sudo git clone <your-repository-url> growu
cd /opt/growu
```

或者通过其他方法将项目文件上传到 `/opt/growu`。

创建专用的服务用户并使其成为应用目录的所有者：

```bash
sudo adduser --system --group --home /opt/growu --shell /usr/sbin/nologin growu
sudo chown -R growu:growu /opt/growu
```

## 配置环境变量

在项目根目录创建 `.env`：

```bash
cd /opt/growu
sudo -u growu nano .env
```

示例：

```env
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu?schema=public"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
AUTH_COOKIE_SECURE="true"
GROWU_ACCOUNTS=""
```

以上示例值均为占位符，部署前请进行替换。

使用长随机值生成 `AUTH_SECRET`，例如：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

当前生产环境不再依赖固定的环境变量账户。全新安装时：

- 将 `GROWU_ACCOUNTS` 留空
- 执行数据库迁移
- 启动应用
- 访问 `/setup` 创建首个管理员账户

`GROWU_ACCOUNTS` 仅用于升级导入，详见 [升级指南](upgrading.zh-CN.md)。

## 安装依赖、执行迁移和构建

```bash
sudo -u growu npm install
sudo -u growu npm run prisma:deploy
sudo -u growu npm run build
```

在新数据库上，应用启动后且系统中尚无账户时，`/setup` 页面可用。

对于仍使用 `GROWU_ACCOUNTS` 的非 Docker 升级，在迁移后手动执行一次性导入：

```bash
sudo -u growu npm run migrate:legacy-accounts
```

全新安装应跳过导入，通过 `/setup` 创建首个管理员。

## 使用 systemd 运行 成长优册（GrowU）

创建 `/etc/systemd/system/growu.service`：

```ini
[Unit]
Description=GrowU Next.js App
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/growu
Environment=NODE_ENV=production
EnvironmentFile=/opt/growu/.env
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5
User=growu
Group=growu

[Install]
WantedBy=multi-user.target
```

该服务以非特权 `growu` 用户身份运行。同时会加载 `/opt/growu/.env`；没有该 `EnvironmentFile`，systemd 启动应用时 `DATABASE_URL` 和 `AUTH_SECRET` 可能缺失。

然后启用并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable growu
sudo systemctl start growu
sudo systemctl status growu
```

查看日志：

```bash
journalctl -u growu -f
```

基本健康检查：

```bash
curl -I http://127.0.0.1:3000/login
```

## 配置 lighttpd 作为反向代理

启用代理支持：

```bash
sudo lighty-enable-mod proxy
sudo lighty-enable-mod setenv
sudo systemctl restart lighttpd
```

创建 `/etc/lighttpd/conf-available/50-growu.conf`：

```lighttpd
$HTTP["host"] == "your-domain.com" {
  proxy.server = (
    "" => (
      (
        "host" => "127.0.0.1",
        "port" => 3000
      )
    )
  )

  # Use "https" when TLS terminates at this proxy.
  setenv.add-environment = (
    "X-Forwarded-Proto" => "https"
  )
}
```

如果仅将该示例用于纯 HTTP 测试，请将 `X-Forwarded-Proto` 设为 `http`，并保持 `AUTH_COOKIE_SECURE="false"`。

启用并重载：

```bash
sudo lighty-enable-mod growu
sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf
sudo systemctl reload lighttpd
```

任何反向代理均可接受，只要它能：

- 将流量转发到 `127.0.0.1:3000`
- 保留原始主机名
- 在使用 HTTPS 时正确设置转发协议

## HTTPS

使用云提供商的 HTTPS 终结功能，或直接在反向代理上配置 TLS。对于 lighttpd，常见的方式是使用 Let's Encrypt 配合 HTTP 到 HTTPS 的重定向。

在 HTTPS 环境下运行时：

- 设置 `AUTH_COOKIE_SECURE="true"`
- 编辑 `.env` 后重启 成长优册（GrowU） 服务

## 首次运行的账户设置

当数据库中没有用户时：

1. 访问 `/setup`
2. 创建初始管理员账户
3. 在 `/login` 登录
4. 在 `/settings/accounts` 管理其他账户

成长优册（GrowU） 强制要求至少有一个启用的管理员账户。

## 更新应用

```bash
cd /opt/growu
sudo -u growu git pull
sudo -u growu npm install
sudo -u growu npm run prisma:deploy
sudo -u growu npm run build
sudo systemctl restart growu
sudo systemctl status growu
```

在应用更新前请备份数据库和 `.env`。

如果此次更新是从旧版 `GROWU_ACCOUNTS` 迁移到基于数据库的账户的一次性操作，请先执行 `sudo -u growu npm run prisma:deploy`，然后在重启服务前运行 `sudo -u growu npm run migrate:legacy-accounts`。验证登录成功后从 `.env` 中移除 `GROWU_ACCOUNTS`。

## 故障排查

### 应用无法访问

检查：

```bash
sudo systemctl status growu
journalctl -u growu -n 100
sudo systemctl status lighttpd
sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf
```

### 数据库连接失败

检查：

- `DATABASE_URL` 是否存在且明确指定
- `DATABASE_URL` 中的密码在需要时已进行 URL 编码
- 数据库主机、端口和名称是否正确
- 托管型 PostgreSQL 实例是否包含所需的 SSL 参数

### 无法访问 /setup

如果 `/setup` 重定向到其他页面，说明至少已存在一个账户。请在 `/login` 登录。

### 升级导入后登录失败

如果您特意使用 `GROWU_ACCOUNTS` 进行升级，请验证升级指南中的导入步骤，然后在导入成功后移除 `GROWU_ACCOUNTS`。
