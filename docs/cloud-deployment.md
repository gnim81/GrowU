# GrowU 云端部署指南（非 Docker）

本文档说明如何把 GrowU 部署到自己的公有云服务器。默认方案是：

- 操作系统：Ubuntu 22.04/24.04 LTS
- 运行时：Node.js 22 LTS 或更新的稳定版本
- 数据库：PostgreSQL
- 进程管理：systemd
- 反向代理：lighttpd，可选但推荐
- HTTPS：使用云厂商证书或 Let's Encrypt

如果你的云服务器不是 Ubuntu，核心流程不变：安装 Node.js、准备 PostgreSQL、配置环境变量、执行迁移、构建、用进程管理器常驻运行。

## 1. 部署前准备

你需要准备：

- 一台云服务器。
- 一个域名，可选但推荐。
- PostgreSQL 数据库，可以安装在同一台服务器，也可以使用云数据库。
- 服务器安全组放行 `80`、`443`，如果只用 IP 访问调试，也可临时放行应用端口。

推荐生产访问方式：

```text
浏览器 -> HTTPS/443 -> lighttpd -> GrowU Node.js 服务 127.0.0.1:3000 -> PostgreSQL
```

不推荐把 `3000` 端口直接暴露到公网长期使用。

## 2. 安装基础软件

登录云服务器：

```bash
ssh root@你的服务器IP
```

更新系统：

```bash
apt update
apt upgrade -y
```

安装基础工具：

```bash
apt install -y curl git lighttpd postgresql postgresql-contrib
```

安装 Node.js。推荐使用 NodeSource：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version
npm --version
```

验收标准：

- `node --version` 能输出版本号。
- `npm --version` 能输出版本号。
- `systemctl status lighttpd` 能看到 lighttpd 已安装。
- `systemctl status postgresql` 能看到 PostgreSQL 已安装。

## 3. 创建 PostgreSQL 数据库

如果使用同机 PostgreSQL，执行：

```bash
sudo -u postgres psql
```

在 PostgreSQL 交互窗口里执行：

```sql
CREATE USER growu WITH PASSWORD 'GrowUpostgres2026';
CREATE DATABASE growu OWNER growu;
\q
```

测试连接：

```bash
psql "postgresql://growu:请替换成强密码@localhost:5432/growu" -c "SELECT 1;"
```

注意：`schema=public` 是 Prisma 使用的连接参数，`psql` 不支持这个参数。用 `psql` 测试连接时不要带 `schema=public`。

如果提示 `database "growu" does not exist`，说明数据库还没有创建成功，或当前命令连接的不是刚才创建数据库的 PostgreSQL 实例。先用 postgres 超级用户检查数据库列表：

```bash
sudo -u postgres psql -c "\l"
```

如果列表中没有 `growu`，重新执行：

```bash
sudo -u postgres psql -c "CREATE USER growu WITH PASSWORD '请替换成强密码';"
sudo -u postgres psql -c "CREATE DATABASE growu OWNER growu;"
```

如果提示用户已存在，只需要创建数据库：

```bash
sudo -u postgres psql -c "CREATE DATABASE growu OWNER growu;"
```

然后再次测试：

```bash
psql "postgresql://growu:请替换成强密码@localhost:5432/growu" -c "SELECT 1;"
```

如果使用云数据库，不需要在服务器上创建数据库，只需要拿到云数据库提供的连接串。常见格式：

```text
postgresql://用户名:密码@数据库地址:5432/数据库名?schema=public&sslmode=require
```

云数据库也分两种情况：

- 云厂商已经创建好数据库：直接使用厂商提供的数据库名。
- 云厂商只创建了实例和账号：需要先在云控制台或用管理账号创建 `growu` 数据库。

应用 `.env` 的 `DATABASE_URL` 使用 Prisma 格式，可以包含 `schema=public`：

```env
DATABASE_URL="postgresql://growu:请替换成强密码@localhost:5432/growu?schema=public"
```

如果云数据库要求 SSL：

```env
DATABASE_URL="postgresql://growu:请替换成强密码@数据库地址:5432/growu?schema=public&sslmode=require"
```

验收标准：

- `SELECT 1` 返回 `1`。
- 应用服务器可以访问数据库地址和端口。
- `psql` 连接测试不依赖 GrowU 代码是否已经部署。

## 4. 上传或拉取代码

推荐把代码放在：

```text
/opt/growu
```

如果使用 Git：

```bash
mkdir -p /opt
cd /opt
git clone 你的代码仓库地址 growu
cd /opt/growu
```

如果不使用 Git，可以通过 SFTP、scp 或云服务器文件管理把项目目录上传到 `/opt/growu`。

验收标准：

- `/opt/growu/package.json` 存在。
- `/opt/growu/prisma/schema.prisma` 存在。

## 5. 配置生产环境变量

在服务器上创建 `.env`：

```bash
cd /opt/growu
nano .env
```

示例：

```env
DATABASE_URL="postgresql://growu:请替换成强密码@localhost:5432/growu?schema=public"
AUTH_SECRET="请替换成一段足够长的随机字符串"
AUTH_COOKIE_SECURE="true"
GROWU_ACCOUNTS='[{"username":"admin","displayName":"管理员","passwordHash":"请替换成密码哈希","enabled":true}]'
```

生成 `AUTH_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

生成登录密码哈希：

```bash
npm install --no-audit --no-fund
npm run hash-password -- 你的登录密码
```

把输出的 `pbkdf2.310000...` 填到 `GROWU_ACCOUNTS` 的 `passwordHash`。不要手写 `$` 分隔的哈希，`.env` 加载器会把 `$...` 当作环境变量展开。

生产环境不要沿用本地示例密码。

验收标准：

- `.env` 中存在 `DATABASE_URL`。
- `.env` 中存在 `AUTH_SECRET`。
- 如果通过 HTTPS 访问，`.env` 中 `AUTH_COOKIE_SECURE` 应为 `true`；如果只是 HTTP/IP 临时调试，应为 `false`。
- `.env` 中存在至少一个启用账号。
- `GROWU_ACCOUNTS` 是合法 JSON 字符串。

## 6. 安装依赖、迁移数据库、构建

在 `/opt/growu` 执行：

```bash
npm install --no-audit --no-fund
npm run prisma:deploy
npm run build
```

验收标准：

- `npm install` 无错误。
- `npm run prisma:deploy` 显示迁移已应用或没有新迁移。
- `npm run build` 显示 `Compiled successfully`。

## 7. 使用 systemd 常驻运行

创建服务文件：

```bash
nano /etc/systemd/system/growu.service
```

写入：

```ini
[Unit]
Description=GrowU Next.js App
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/growu
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
systemctl daemon-reload
systemctl enable growu
systemctl start growu
systemctl status growu
```

查看日志：

```bash
journalctl -u growu -f
```

验收标准：

- `systemctl status growu` 显示 `active (running)`。
- 服务器本机执行下面命令返回登录页 HTML：

```bash
curl -I http://127.0.0.1:3000/login
```

## 8. 配置 lighttpd 反向代理

启用 lighttpd 反向代理和请求头模块：

```bash
lighty-enable-mod proxy
lighty-enable-mod setenv
systemctl restart lighttpd
```

创建 GrowU 配置文件：

```bash
nano /etc/lighttpd/conf-available/50-growu.conf
```

写入以下配置。如果暂时用 IP 访问，可以保留 `$HTTP["host"]` 外层不写，直接使用 `proxy.server`。如果使用域名，推荐保留下面的域名匹配。

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

  setenv.add-environment = (
    "X-Forwarded-Proto" => "http"
  )
}
```

启用配置：

```bash
lighty-enable-mod growu
lighttpd -tt -f /etc/lighttpd/lighttpd.conf
systemctl reload lighttpd
```

如果没有域名、只想用服务器 IP 调试，把 `/etc/lighttpd/conf-available/50-growu.conf` 写成：

```lighttpd
proxy.server = (
  "" => (
    (
      "host" => "127.0.0.1",
      "port" => 3000
    )
  )
)
```

验收标准：

- `lighttpd -tt -f /etc/lighttpd/lighttpd.conf` 显示配置正确。
- 浏览器访问服务器 IP 或域名可以看到 GrowU 登录页。

## 9. 配置 HTTPS

如果云厂商提供证书和负载均衡，可以在云厂商控制台配置 HTTPS，然后转发到服务器 `80` 或 `3000`。

如果直接在服务器上申请 Let's Encrypt 证书，建议使用 `certbot certonly --webroot` 申请证书，然后手动配置 lighttpd。

先启用静态目录映射模块：

```bash
lighty-enable-mod alias
systemctl restart lighttpd
```

在 `/etc/lighttpd/conf-available/50-growu.conf` 的 HTTP 配置中加入 ACME 校验目录，保证证书申请时可以访问 `/.well-known/acme-challenge/`：

```lighttpd
alias.url += (
  "/.well-known/acme-challenge/" => "/var/www/letsencrypt/.well-known/acme-challenge/"
)
```

创建目录并申请证书：

```bash
apt install -y certbot
mkdir -p /var/www/letsencrypt/.well-known/acme-challenge
systemctl reload lighttpd
certbot certonly --webroot -w /var/www/letsencrypt -d your-domain.com
```

为证书续期后生成 lighttpd 可用的 PEM 文件，创建脚本：

```bash
nano /usr/local/bin/growu-renew-cert.sh
```

写入：

```bash
#!/usr/bin/env bash
set -euo pipefail
DOMAIN="your-domain.com"
cat "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" > "/etc/letsencrypt/live/${DOMAIN}/lighttpd.pem"
chmod 600 "/etc/letsencrypt/live/${DOMAIN}/lighttpd.pem"
systemctl reload lighttpd
```

执行：

```bash
chmod +x /usr/local/bin/growu-renew-cert.sh
/usr/local/bin/growu-renew-cert.sh
```

启用 lighttpd SSL 和跳转模块：

```bash
lighty-enable-mod ssl
lighty-enable-mod redirect
systemctl restart lighttpd
```

修改 `/etc/lighttpd/conf-available/50-growu.conf`：

```lighttpd
$HTTP["scheme"] == "http" {
  $HTTP["host"] == "your-domain.com" {
    $HTTP["url"] !~ "^/\\.well-known/acme-challenge/" {
      url.redirect = ("" => "https://your-domain.com${url.path}${qsa}")
    }
  }
}

$SERVER["socket"] == ":443" {
  ssl.engine = "enable"
  ssl.pemfile = "/etc/letsencrypt/live/your-domain.com/lighttpd.pem"
  ssl.ca-file = "/etc/letsencrypt/live/your-domain.com/chain.pem"

  $HTTP["host"] == "your-domain.com" {
    proxy.server = (
      "" => (
        (
          "host" => "127.0.0.1",
          "port" => 3000
        )
      )
    )

    setenv.add-environment = (
      "X-Forwarded-Proto" => "https"
    )
  }
}
```

测试并重载：

```bash
lighttpd -tt -f /etc/lighttpd/lighttpd.conf
systemctl reload lighttpd
```

配置证书续期后自动刷新 lighttpd PEM 文件：

```bash
certbot renew --dry-run --deploy-hook /usr/local/bin/growu-renew-cert.sh
```

如果 dry-run 正常，把 deploy hook 写入 Certbot renewal 配置，或创建一个 cron/systemd timer 定期执行：

```bash
certbot renew --deploy-hook /usr/local/bin/growu-renew-cert.sh
```

验收标准：

- 浏览器访问 `https://your-domain.com/login` 正常。
- 浏览器地址栏显示安全锁。
- `certbot renew --dry-run` 成功。

## 10. 更新应用

每次更新代码后：

```bash
cd /opt/growu
git pull
npm install --no-audit --no-fund
npm run prisma:deploy
npm run build
systemctl restart growu
systemctl status growu
```

验收标准：

- 迁移成功。
- 构建成功。
- 服务重启后仍可访问 `/login`。

## 11. 备份数据库

至少定期备份 PostgreSQL 数据库。

手动备份：

```bash
mkdir -p /opt/backups/growu
pg_dump "postgresql://growu:数据库密码@localhost:5432/growu" > /opt/backups/growu/growu-$(date +%F).sql
```

恢复示例：

```bash
psql "postgresql://growu:数据库密码@localhost:5432/growu" < /opt/backups/growu/growu-YYYY-MM-DD.sql
```

建议：

- 数据库密码不要写进公开脚本。
- 备份文件应定期下载或同步到对象存储。
- 更新应用前先备份数据库。

## 12. 常见问题

### 12.1 页面打不开

检查：

```bash
systemctl status growu
journalctl -u growu -n 100
systemctl status lighttpd
lighttpd -tt -f /etc/lighttpd/lighttpd.conf
```

### 12.2 数据库连接失败

检查：

```bash
cat /opt/growu/.env
psql "$DATABASE_URL" -c "SELECT 1;"
```

如果使用云数据库，确认：

- 数据库白名单允许云服务器公网 IP 或内网 IP。
- `DATABASE_URL` 包含正确端口。
- 云数据库要求 SSL 时追加 `sslmode=require`。

### 12.3 登录失败

检查：

- `GROWU_ACCOUNTS` 是否是合法 JSON。
- `enabled` 是否为 `true`。
- `passwordHash` 是否来自 `npm run hash-password -- 密码`。
- 修改 `.env` 后是否执行了 `systemctl restart growu`。

### 12.4 端口冲突

检查：

```bash
ss -ltnp | grep 3000
```

如果 `3000` 被占用，可以修改 systemd 里的端口，同时修改 lighttpd 的 `proxy.server` 端口。

## 13. 生产安全建议

- 不要把 `.env` 提交到代码仓库。
- 生产账号密码不要使用本地示例密码。
- 云服务器只开放必要端口，通常是 `22`、`80`、`443`。
- PostgreSQL 不要直接开放公网，优先只允许本机或内网访问。
- 定期备份数据库。
- 修改 `.env` 后必须重启 `growu` 服务。
