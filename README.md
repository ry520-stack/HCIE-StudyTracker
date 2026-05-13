# StudyTracker — 学习追踪器

全栈学习管理应用，支持任务管理、艾宾浩斯复习、番茄钟专注、每日打卡、成就系统。

**Android APK + Web 双端可用，数据云端同步。**

## 功能

- 仪表盘概览（名言、目标、成就、统计）
- 任务管理（短期/长期 + 优先级 🔴🟡🟢）
- 学习笔记 + 艾宾浩斯遗忘曲线复习提醒
- 番茄钟专注计时 + 切屏防作弊
- 每日打卡 + 日历热力图 + 补签卡（每周3张）
- 14 个成就徽章自动解锁
- 服务器同步（注册登录后数据云端存储，换手机恢复）
- 深色/浅色主题
- 数据导出/导入

## 技术栈

| 端 | 技术 |
|---|---|
| 前端 Web 版 | React 19 + TypeScript + Tailwind CSS + Vite |
| 前端 APK 版 | Vanilla HTML/CSS/JS（HBX 5+App 打包） |
| 后端 | Node.js + Express + Prisma ORM |
| 数据库 | PostgreSQL 16 |
| 部署 | Docker Compose + Cloudflare Tunnel |
| 认证 | JWT Bearer Token |

## 项目结构

```
StudyTracker/
├── backend/           # Express API 服务
│   ├── src/
│   │   ├── controllers/  # 路由处理
│   │   ├── services/     # 业务逻辑
│   │   ├── routes/       # 路由定义
│   │   └── middlewares/  # JWT 认证中间件
│   └── prisma/           # 数据库 Schema + 迁移
├── frontend/          # React Web 前端
│   └── src/pages/        # Dashboard/Tasks/Notes/Focus/Checkin/Settings
├── standalone-app/    # APK 打包源码（纯 HTML/CSS/JS）
├── docker-compose.yml # 一键部署
└── ARCHITECTURE.md    # 架构设计文档
```

## 快速部署

```bash
# 1. 克隆仓库
git clone https://github.com/ry520-stack/StudyTracker.git
cd StudyTracker

# 2. 启动服务（需要 Docker）
docker compose up -d --build

# 3. 访问 http://localhost
```

## APK 下载

[GitHub Releases](https://github.com/ry520-stack/StudyTracker/releases) 下载最新 APK。

## License

MIT
