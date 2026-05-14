# StudyTracker — 学习追踪器

全栈学习管理应用，支持任务管理、艾宾浩斯复习、番茄钟专注、每日打卡、成就系统。

**Android APK + Web 双端可用，数据云端同步，离线自动缓存。**

## 功能

- 仪表盘概览（名言、目标、成就、统计、随笔）
- 任务管理（短期/长期 + 优先级 🔴🟡🟢 + 技能树视图）
- 学习笔记 + 艾宾浩斯遗忘曲线复习提醒
- 闪卡复习（正面/背面翻转，生疏/模糊/熟练三级评分）
- 番茄钟专注计时 + 切屏防作弊
- 每日打卡 + 日历热力图 + 补签卡（每周3张）
- 14 个成就徽章自动解锁
- 邮箱验证码注册（SMTP + 数学题防刷）
- 服务器同步（注册登录后数据云端存储，一键恢复）
- 离线模式（断网自动缓存，联网自动同步队列）
- 深色/浅色主题
- 数据导出/导入
- 服务器地址可修改（隧道 URL 变了不用重新打包）

## 技术栈

| 端 | 技术 |
|---|---|
| 前端 Web 版 | React 19 + TypeScript + Tailwind CSS + Vite |
| 前端 APK 版 | React SPA (HashRouter) + HBuilderX 5+App 打包 |
| 后端 | Node.js + Express + Prisma ORM + Nodemailer |
| 数据库 | PostgreSQL 16 |
| 部署 | Docker Compose + Nginx + Cloudflare Tunnel |
| 认证 | JWT Bearer Token + 邮箱验证码 |

## 项目结构

```
StudyTracker/
├── backend/           # Express API 服务
│   ├── src/
│   │   ├── controllers/  # 路由处理（auth/note/task/focus/checkin/setting）
│   │   ├── services/     # 业务逻辑 + 邮件服务 + 验证码
│   │   ├── routes/       # 路由定义
│   │   └── middlewares/  # JWT 认证中间件
│   └── prisma/           # 数据库 Schema + 迁移
├── frontend/          # React 前端
│   ├── src/
│   │   ├── pages/        # Dashboard/Tasks/Notes/Focus/Checkin/Settings/Login/Register
│   │   ├── components/   # Navbar/Sidebar/TimerDisplay 等
│   │   ├── contexts/     # AuthContext/ThemeContext
│   │   ├── api/          # API 客户端 + 离线同步
│   │   └── layouts/      # DashboardLayout
│   └── dist/             # 构建产物（HBX 打包用）
├── docker-compose.yml       # 开发环境
├── docker-compose.prod.yml  # 生产环境
└── ARCHITECTURE.md          # 架构设计文档
```

## 快速部署

```bash
# 1. 克隆仓库
git clone https://github.com/ry520-stack/StudyTracker.git
cd StudyTracker

# 2. 配置环境变量
cat > .env << EOF
JWT_SECRET=your-secret-key
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

# 3. 启动服务（需要 Docker）
docker compose -f docker-compose.prod.yml up -d --build

# 4. 启动 Cloudflare Tunnel（可选，用于公网访问）
cloudflared tunnel --url http://localhost:80
```

## APK 下载

[GitHub Releases](https://github.com/ry520-stack/StudyTracker/releases) 下载最新 APK。

## License

MIT
