# GrowU 本地调试准备

本文档用于在 Windows 本机调通 GrowU。云端部署不需要 Docker，本地调试也不依赖 Docker。

## 1. 当前项目侧配置

项目根目录已经生成 `.env`，本地默认配置如下：

- 数据库：`growu`
- 数据库用户：`postgres`
- 数据库密码：`GrowUlocal2026`
- 应用登录账号：`admin`
- 应用登录密码：`GrowUadmin2026`
- Cookie 安全模式：`AUTH_COOKIE_SECURE=false`，允许手机通过局域网 HTTP 地址调试。

`.env` 已被 `.gitignore` 忽略，不应提交到代码仓库。

## 2. 安装 PostgreSQL

需要使用管理员 PowerShell 执行。普通权限可能会因为 Chocolatey 目录权限失败。

```powershell
choco install postgresql --yes --params '/Password:GrowUlocal2026 /Port:5432'
```

如果提示 Chocolatey 锁文件或权限错误，先确认没有其他 Chocolatey 进程运行，然后在管理员 PowerShell 中删除提示中的锁文件，再重试安装。

## 3. 确认 PostgreSQL 可用

重新打开 PowerShell 后执行：

```powershell
psql --version
Get-Service -Name postgresql* | Select-Object Name,Status,DisplayName
```

服务状态应为 `Running`。

## 4. 创建本地数据库

```powershell
createdb -U postgres growu
```

提示输入密码时，输入：

```text
GrowUlocal2026
```

如果 `createdb` 不在 PATH，可以使用 PostgreSQL 安装目录下的完整路径，例如：

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres growu
```

## 5. 初始化数据库表

在项目根目录执行：

```powershell
npm run prisma:deploy
```

## 6. 启动本地服务

```powershell
npm run dev
```

浏览器访问：

```text
http://localhost:3000
```

使用账号 `admin` 和密码 `GrowUadmin2026` 登录。

如果手机能登录但提交加减分后跳回登录页，确认 `.env` 中有：

```env
AUTH_COOKIE_SECURE="false"
```

修改后需要重新 `npm run build` 并重启应用服务。

## 7. 云端部署方向

当前项目按公有云部署目标开发：

- 使用标准 Node.js 服务运行 Next.js。
- 使用 PostgreSQL 作为数据库。
- 使用环境变量提供数据库连接、认证密钥和固定账号。
- 使用 `npm run prisma:deploy` 初始化云端数据库结构。
- 使用 `npm run build` 和 `npm run start` 运行生产服务。

云端不需要 Docker，但云服务器需要安装 Node.js，并能访问 PostgreSQL。
