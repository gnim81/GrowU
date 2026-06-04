# Cloud Deployment

This guide covers non-Docker deployment of GrowU on a cloud VM or bare server. The examples use Ubuntu, Node.js, PostgreSQL, `systemd`, and `lighttpd`, but the same application can run behind any reverse proxy that forwards requests to the Node.js process.

## Deployment Model

Recommended production flow:

```text
Browser -> HTTPS reverse proxy -> GrowU Node.js service on 127.0.0.1:3000 -> PostgreSQL
```

Do not expose the application port directly to the public internet for normal operation.

## Requirements

- Ubuntu 22.04 or 24.04 LTS, or another Linux distribution with equivalent packages
- Node.js 22 LTS or later
- PostgreSQL
- A process manager such as `systemd`
- A reverse proxy such as `lighttpd`, Nginx, Caddy, or a cloud load balancer
- HTTPS for production use

## Install Base Packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git lighttpd postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
```

Verify:

```bash
node --version
npm --version
systemctl status postgresql
systemctl status lighttpd
```

## Create the PostgreSQL Database

If PostgreSQL runs on the same server:

```bash
sudo -u postgres psql
```

Then create a dedicated database and user with your own generated password:

```sql
CREATE USER growu WITH PASSWORD 'replace-with-a-strong-database-password';
CREATE DATABASE growu OWNER growu;
\q
```

Test the connection:

```bash
psql "postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu" -c "SELECT 1;"
```

`psql` does not use Prisma's `schema=public` query parameter. Add that only in the application `DATABASE_URL`.

If your PostgreSQL password contains reserved URI characters, URL-encode the password portion before placing it in a connection string.

Example application connection string:

```env
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu?schema=public"
```

For managed PostgreSQL services, use the provider's host, port, database name, and SSL settings instead.

## Get the Application Code

```bash
sudo mkdir -p /opt
cd /opt
sudo git clone <your-repository-url> growu
cd /opt/growu
```

Or upload the project files to `/opt/growu` by another method.

## Configure Environment Variables

Create `.env` in the project root:

```bash
cd /opt/growu
nano .env
```

Example:

```env
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu?schema=public"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
AUTH_COOKIE_SECURE="true"
GROWU_ACCOUNTS=""
```

The example values above are placeholders. Replace them before deployment.

Generate `AUTH_SECRET` with a long random value, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Current production setup does not depend on fixed environment-defined accounts. On a fresh install:

- leave `GROWU_ACCOUNTS` empty
- apply migrations
- start the app
- visit `/setup` to create the first admin account

`GROWU_ACCOUNTS` is only for upgrade import and is covered in [docs/upgrading.md](docs/upgrading.md).

## Install Dependencies, Apply Migrations, and Build

```bash
npm install
npm run prisma:deploy
npm run build
```

On a new database, `/setup` becomes available after the app starts and no account exists yet.

## Run GrowU with systemd

Create `/etc/systemd/system/growu.service`:

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

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable growu
sudo systemctl start growu
sudo systemctl status growu
```

View logs:

```bash
journalctl -u growu -f
```

Basic health check:

```bash
curl -I http://127.0.0.1:3000/login
```

## Configure lighttpd as a Reverse Proxy

Enable proxy support:

```bash
sudo lighty-enable-mod proxy
sudo lighty-enable-mod setenv
sudo systemctl restart lighttpd
```

Create `/etc/lighttpd/conf-available/50-growu.conf`:

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

Enable and reload:

```bash
sudo lighty-enable-mod growu
sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf
sudo systemctl reload lighttpd
```

Any reverse proxy is acceptable as long as it:

- forwards traffic to `127.0.0.1:3000`
- preserves the original host
- sets the forwarded protocol correctly when using HTTPS

## HTTPS

Use your cloud provider's HTTPS termination or configure TLS directly on the reverse proxy. For `lighttpd`, a common approach is Let's Encrypt plus a redirect from HTTP to HTTPS.

When running behind HTTPS:

- set `AUTH_COOKIE_SECURE="true"`
- restart the GrowU service after editing `.env`

## First-Run Account Setup

When the database contains no users:

1. Open `/setup`
2. Create the initial admin account
3. Sign in at `/login`
4. Manage additional accounts at `/settings/accounts`

GrowU enforces at least one enabled admin account.

## Updating the Application

```bash
cd /opt/growu
git pull
npm install
npm run prisma:deploy
npm run build
sudo systemctl restart growu
sudo systemctl status growu
```

Back up the database and `.env` before applying updates.

## Troubleshooting

### App is unreachable

Check:

```bash
sudo systemctl status growu
journalctl -u growu -n 100
sudo systemctl status lighttpd
sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf
```

### Database connection fails

Check:

- `DATABASE_URL` is present and explicit
- the password inside `DATABASE_URL` is URL-encoded if needed
- the database host, port, and name are correct
- managed PostgreSQL instances include any required SSL parameters

### `/setup` is not available

If `/setup` redirects away, at least one account already exists. Sign in at `/login` instead.

### Login fails after an upgrade import

If you intentionally used `GROWU_ACCOUNTS` for an upgrade, verify the import steps in [docs/upgrading.md](docs/upgrading.md), then remove `GROWU_ACCOUNTS` after the import succeeds.

## Translation Prompt

Translate this document into Simplified Chinese for public server deployment documentation. Keep all Markdown structure, code blocks, filenames, paths, commands, environment variable names, and route paths unchanged. Preserve the warnings about placeholder values, URL-encoding passwords, `/setup`, and the fact that `GROWU_ACCOUNTS` is only for upgrades.
