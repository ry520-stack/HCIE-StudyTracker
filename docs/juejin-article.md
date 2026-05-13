# 大专生+AI结对编程：从零到上线，一个HCIE学习追踪器的全栈实战

> 三周，一位Claude，一台阿里云ECS，0 元预算。这是一个关于「跟AI结对编程，把一个全栈项目从Bug堆修成能用的产品，再到部署上线」的完整记录。

---

## 一、我是谁，为什么要做这个

云计算大专在读，正在备考 HCIE（华为认证ICT专家）。

备考过程中需要：管理学习任务、记笔记并定期复习、番茄钟专注、每日打卡。市面上没有一款工具能同时满足这四个需求。于是决定自己写。

**一个人写不了？找AI当结对程序员。**

---

## 二、项目是干什么的

HCIE StudyTracker — 一个全栈学习追踪应用。功能模块：

| 模块 | 功能 |
|------|------|
| 📊 仪表盘 | 每日概览、学习目标进度、成就徽章、随笔 |
| ✅ 任务管理 | 创建/筛选/完成/删除，短期+长期分类，优先级标注 |
| 📝 学习笔记 | 基于艾宾浩斯遗忘曲线的自动复习安排，标签筛选 |
| ⏱️ 专注番茄钟 | 倒计时+环形进度条，切屏检测防作弊 |
| 📅 每日打卡 | 签到/补签卡/日历热力图/连续天数统计 |
| 💬 每日名言 | 自定义名言库，随机展示 |
| 🔐 账号系统 | JWT注册/登录，数据云端同步，换设备自动恢复 |

**技术栈**：React + TypeScript + Tailwind CSS（前端） / Express + Prisma + PostgreSQL（后端） / Docker + Nginx（部署） / Cloudflare Tunnel（公网穿透）

---

## 三、架构

```
用户浏览器
    │
    ▼
Cloudflare Tunnel (trycloudflare.com)
    │
    ▼
阿里云 ECS (8.140.192.214)
    │
    ├─ Nginx (80端口) → React SPA 静态文件
    │
    └─ /api/* 反向代理 → Express (3001端口)
                              │
                              ▼
                         PostgreSQL (5432端口)
```

三个 Docker 容器：frontend (nginx+react) / backend (express) / db (postgres)

---

## 四、调试实录：修了 14 个 Bug 的完整过程

### Bug 1：按钮点击完全没反应

**现象**：登录后点任何按钮——添加任务、保存笔记、开始专注——UI 纹丝不动。

**排查过程**：
1. 怀疑 React 事件绑定 → 检查 onClick 正常
2. 怀疑 API 调用失败 → 打开 DevTools Network 面板，发现所有 `/api/*` 请求返回空响应
3. 怀疑后端没启动 → `docker ps` 发现后端容器在跑
4. 检查后端日志 → `TS2339: Property 'userId' does not exist on type 'Request'`

**根因**：`express.d.ts` 类型扩展文件在 `ts-node` 下不生效。`ts-node` 默认跳过 `.d.ts` 文件，导致 `req.userId` 编译失败，后端根本无法启动。

**修复**：在 `tsconfig.json` 加 `"ts-node": { "files": true }`，强制 ts-node 加载类型声明文件。

**教训**：`tsc --noEmit` 通过不代表 `ts-node` 能跑。编译时检查和运行时加载是两回事。

---

### Bug 2：按钮还是没反应（第二层原因）

**现象**：后端启动后，按钮偶尔还是没反应。

**排查**：检查前端代码，发现所有按钮的 async handler 都没有 try/catch：

```typescript
// TasksPage.tsx - 修复前
async function handleAdd() {
  await createTask({...});  // 如果这里抛异常
  setTitle('');             // 这行永远不会执行
  load();                   // 这行也不会执行
}
```

API 调用失败 → 异常未捕获 → 后续 setState 全部跳过 → UI 冻结。

**修复**：所有按钮操作加了 `try/catch` + `alert` 提示。共涉及 TasksPage、NotesPage、DashboardPage、CheckinPage、SettingsPage 五个文件。

---

### Bug 3：艾宾浩斯复习——"记忆大师"成就永远无法解锁

**代码审查发现**：

```typescript
// note.service.ts - 修复前
nextReviewAt: getNextReviewTime(newReviewCount),
// getNextReviewTime 在 reviewCount >= 8 时返回 120天，永远不是 null
```

独立版逻辑是正确的——超过 8 次复习设 `nextReviewAt = null` 表示"已巩固"。但 React 版后端漏了这一步。

**影响**："记忆大师"（积累5个已巩固笔记）成就永远无法达成。

**修复**：`newReviewCount < 8 ? getNextReviewTime(...) : null`

---

### Bug 4：番茄钟切屏后倒计时变慢

**代码审查发现**：

```typescript
// FocusPage.tsx - 修复前
const deduct = Math.min(Math.floor(tickDelta / 1000), 1);
// 最多只扣 1 秒，剩余隐藏时间直接丢弃
totalHiddenRef.current = 0;
```

用户切屏 5 秒 → totalHiddenRef 累积 5000ms → 定时器只扣 1 秒 → 重置 → 4 秒白白丢掉。

**修复**：去掉 `Math.min(..., 1)` 上限，用 `effectiveDelta` 正确计算应扣秒数。

---

### Bug 5：放弃专注丢失已用时间

```typescript
// FocusPage.tsx - 修复前
updateSession(sid, { status: 'FAILED', elapsed: 0, ... });
// 硬编码 elapsed=0，40分钟白专注了
```

**修复**：`elapsed: duration - remainingRef.current`，保留实际已用时间。

---

### Bug 6：每日名言永远 401

Navbar.tsx 用原生 `fetch` 请求 `/api/quote`，不带 JWT token。而 `/api/quote` 路由在认证中间件后面 → 永远 401 → 永远显示 fallback。

**修复**：改用带 token 的 `api()` 封装函数。

---

### Bug 7：登录/注册——"JSON 输入结束"

**现象**：登录页显示"执行 json 操作失败，响应数据意外结束"。

**排查**：`fetch` 请求到后端，收到空响应。后端没在跑。

**根因**：后来发现是 Bug 1 的后端编译失败 + 用户不知道要开两个终端分别启动前后端。

---

### Bug 8：checkin 错误提示永远是 fallback

```typescript
// CheckinPage.tsx - 修复前
catch (e: any) {
  alert(e?.response?.data?.error || '打卡失败');
  // e 是 Error 对象，没有 response.data 这种 Axios 结构
}
```

**修复**：改为 `e.message`。

---

### Bug 9：login 页硬编码测试凭据

`useState('test@example.com')` 和 `useState('123456')` 直接写在组件里，会随生产构建发布。

**修复**：改为空字符串。

---

### Bug 10-11：独立版 Service Worker + 双重计时

- `sw.js` 使用 cache-first 策略，代码更新后用户看到的是旧缓存
- 切屏时 `setInterval` 和 `requestAnimationFrame` 同时跑，时间累计不准

**修复**：SW 改为 network-first；切屏时 `stopTick()` 停止 setInterval。

---

### Bug 12-14：Docker 构建超时 + 端口混乱 + 隧道跑错端口

- `npm ci` 在服务器上连不上 npmjs.org → 超时 → 改用淘宝镜像 `registry.npmmirror.com`
- cloudflared 隧道指向了 9090 端口 → 改成 80
- `pkill` 拼成 `pkill`、路径写错等手滑

---

## 五、云服务器部署全过程

### 环境
- 阿里云 ECS (Alibaba Cloud Linux 3)
- Docker 26.1.3
- 2核2G，按量付费

### 部署步骤

```bash
# 1. 安装 Docker（已装好）
# 2. 克隆项目
git clone https://github.com/ry520-stack/HCIE-StudyTracker.git
cd HCIE-StudyTracker

# 3. 构建并启动
docker compose build --no-cache
docker compose up -d
```

### 遇到的坑

**阿里云拦截未备案 HTTP**：80 端口在安全组放行后仍然无法从公网访问。阿里云对未备案域名的 HTTP 流量有额外限制。

**解决方案**：Cloudflare Tunnel。在服务器上跑 `cloudflared tunnel --url http://localhost:80`，Cloudflare 分配一个 `*.trycloudflare.com` 子域名，流量走 Cloudflare 全球网络进入服务器，绕过备案问题。

### 保持隧道后台运行

```bash
nohup ~/cloudflared tunnel --url http://localhost:80 > /dev/null 2>&1 &
```

---

## 六、截图建议

建议在文章中贴以下截图：

1. **仪表盘全貌** — 展示概览页（目标进度+任务+成就+随笔）
2. **任务列表** — 短期/长期筛选 + 优先级标注
3. **笔记页** — 标签筛选 + 艾宾浩斯复习状态
4. **专注计时器** — 环形进度条 + 倒计时中
5. **打卡日历** — 月度热力图 + 连续天数
6. **设置页** — 危险区域的红色重置按钮
7. **DevTools Network 面板** — Bug 排查时抓到的空响应
8. **Docker ps 输出** — 三个容器运行状态
9. **Cloudflare Tunnel 输出** — `trycloudflare.com` URL 生成截图
10. **GitHub 仓库页** — commit 历史截图

---

## 七、GitHub 地址

https://github.com/ry520-stack/HCIE-StudyTracker

---

## 八、和 AI 结对编程的感受

以前 debug 一个小时找不到问题，现在把代码丢给 Claude，它 5 分钟定位到 `ts-node` 不加载 `.d.ts` 文件。

以前部署踩坑要查半天博客，现在直接说"服务器上 npm 超时了"，它秒回"换国内镜像"。

**不是 AI 替我写代码，是 AI 把"搜资料→排查→试错"的循环从 2 小时压缩到 5 分钟。**

---

## 九、写在最后

我是一名大专云计算学生。这个项目从第一行代码到上线，全程跟 AI 配合完成。它帮我发现了我自己根本想不到的 bug（比如 ts-node 不加载 .d.ts、艾宾浩斯永远不巩固）。

如果你也在自学，建议找一个 AI 工具当你的 code reviewer 和 debugger。不会替代你，但能让你少走 80% 的弯路。

这个项目还会迭代：后续想加闪卡复习、移动端打包（HBX 5+App）、WebSocket 实时同步。欢迎 star 和提 issue。

---

*作者：云计算大专在读，HCIE 备考中*
*GitHub: [ry520-stack](https://github.com/ry520-stack)*
