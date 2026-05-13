# StudyTracker 架构设计与核心逻辑复盘

> 一份面向面试与复盘的高级全栈架构笔记
> 技术栈：React 19 + TypeScript + Tailwind CSS 3 / Node.js + Express + Prisma ORM / SQLite → PostgreSQL

---

## 一、架构基础：技术选型与权衡

### 1.1 整体架构

```
┌──────────────┐     HTTP/JSON     ┌──────────────┐     Prisma ORM     ┌──────────┐
│  React SPA   │  ──────────────→  │  Express API  │  ──────────────→  │ Database │
│  (Vite 构建)  │  ←──────────────  │  (Node.js)    │  ←──────────────  │(SQLite/) │
│  端口 :5173   │    Bearer Token   │  端口 :3001   │                  │PostgreSQL│
└──────────────┘                   └──────────────┘                   └──────────┘
        │                                  │
        └── 开发期 Vite Proxy 转发 /api ────┘
        └── 生产期 Nginx 反向代理 /api ────┘
```

### 1.2 技术选型理由

| 层 | 选型 | 理由 |
|---|---|---|
| **前端框架** | React 19 | 生态最成熟，Hooks 驱动状态管理天然适合计时器这类实时 UI；19 的并发模式为未来扩展预留空间 |
| **构建工具** | Vite 8 | 开发冷启动 < 1s，HMR 极快；对比 Webpack 的庞大配置，Vite 零配置即可用 TypeScript + CSS |
| **样式方案** | Tailwind CSS 3 + `darkMode: 'class'` | 无运行时开销，dark/light 切换只需在 `<html>` 上 toggle class，无需多个 CSS 文件切换 |
| **后端框架** | Express 4 | 极简、稳定、中间件生态成熟。对于 CRUD + 认证的场景，Koa/Nest 的额外抽象反而增加心智负担 |
| **ORM** | Prisma | 类型安全的查询、自动生成的 migration、Schema-first 设计。相比 TypeORM，Prisma 的 schema 声明更直观，且 migration 文件可追踪 |
| **数据库** | SQLite（开发）→ PostgreSQL（生产） | 开发期零配置，无需安装 Docker 即可启动；prod 切到 PG 获得并发写入能力和数据安全性 |

### 1.3 SQLite 替代 PostgreSQL 的本地开发方案

这是一个关键的架构决策：**如何在本地用 SQLite 开发，生产环境无缝切换到 PostgreSQL？**

核心思路是 **Prisma Schema 多态**——Prisma 的 `datasource.provider` 字段决定数据库方言，因此我们维护两份 Schema：

```
backend/prisma/
├── schema.prisma         # 开发环境：provider = "sqlite"
└── schema.prod.prisma    # 生产环境：provider = "postgresql"
```

**关键坑点**：

- Prisma 不允许 `provider` 使用环境变量，必须在 Schema 文件中写死。这意味着不能靠 `.env` 动态切换。
- 两个 Schema 的模型定义必须完全一致，否则 `prisma generate` 会生成不同的 Client 类型，导致编译冲突。
- 解决方案：`schema.prod.prisma` 从 `schema.prisma` 整体复制，只改 `provider` 那一行。生产 Dockerfile 在 `prisma generate` 前用 prod schema 覆盖开发 schema。

> **面试一问**：为什么不让 Provider 可配置？Prisma 团队的设计哲学是——Provider 决定了 Client 的查询能力（如数组类型、JSON 操作），动态 provider 会导致生成的 Client 类型不稳定。

---

## 二、数据库设计：核心表结构与避坑

### 2.1 核心模型关系

```
User (1) ──→ (N) Note (1) ──→ (N) ReviewRecord
  │
  ├── (1) ──→ (N) Task
  │
  └── (1) ──→ (N) FocusSession

Quote（独立表，无外键）
```

### 2.2 设计要点

**User 模型**：
- `role` 字段用 `String` 而非 `enum`——因为 SQLite 不支持 Prisma Enum。用 `@default("USER")` 兜底，未来扩展 ADMIN 等角色不改 Schema。

**Note 模型**：
- `tags` 字段以 JSON 字符串存入（如 `["OSPF","BGP"]`），而非关联表。高频读 + 标签数量稀少（通常 < 5），关联表反而增加查询开销。
- `nextReviewAt` + `reviewCount` 驱动艾宾浩斯复习计划。

**FocusSession 模型**：
- `duration` 是计划时长（默认 2700s = 45min），`elapsed` 是实际计时（秒），两者解耦便于作弊扣减逻辑。
- `status` 用字符串枚举驱动状态机。

### 2.3 关键避坑：Prisma 外键约束与 `onDelete: Cascade`

**问题场景**：删除一条 Note 时，PostgreSQL 报外键冲突：

```
Foreign key constraint failed on field: ReviewRecord_noteId_fkey
```

**根因分析**：Prisma 默认的外键行为是 `NoAction`（即约束存在但不由 Prisma 管理级联）。当 Note 被删除时，其关联的 ReviewRecord 表中的 `noteId` 变为悬空指针，数据库拒绝删除。

**修复方案**：在 `ReviewRecord` 模型的 `note` 关系上显式声明 `onDelete: Cascade`：

```prisma
model ReviewRecord {
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
  noteId String
}
```

> **经验总结**：Prisma 的 `@relation` 装饰器默认不级联，这在很多 ORM（TypeORM、Django ORM）中也是默认行为。**设计 Schema 阶段就应该想清楚：当父级被删除，子级应该怎样——Cascade（级联删）、SetNull（置空）、Restrict（阻止）？** 对于 ReviewRecord 这种审计日志性质的表，Cascade 是正确选择——笔记都没了，复习记录自然没有保留意义。

---

## 三、核心业务一：专注倒计时

### 3.1 状态机流转

```
                   ┌──────────┐
                   │   idle   │  ← 初始态/结束后重置
                   └────┬─────┘
                        │ 用户点击「开始专注」
                        ▼
            ┌──────────────────────┐
            │      running         │  ← 倒计时递减中
            └──┬───────────────┬───┘
               │               │
         点击暂停         切屏超过 60s
               ▼               ▼
    ┌──────────────┐    ┌──────────┐
    │   paused     │    │  failed  │  ← 防作弊触发
    └──────┬───────┘    └──────────┘
           │                      │
       点击继续               回到 idle
           │                      │
           ▼                      ▼
      running (恢复)           idle
           │
           │  倒计时归零
           ▼
    ┌──────────────┐
    │  completed   │──→ idle
    └──────────────┘
```

**状态持久化**：每次状态变更同步更新后端 `FocusSession.status`，确保浏览器崩溃后恢复时能正确还原状态。

### 3.2 防作弊体系（核心技术点）

这是整个项目中最具技术深度的模块。核心逻辑基于 **Page Visibility API**：

**原理**：

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenStartRef.current = Date.now();  // 记录切屏时刻
    timerRef.current = requestAnimationFrame(tick);
  } else {
    const hiddenDuration = Date.now() - hiddenStartRef.current;
    if (hiddenDuration > FAIL_THRESHOLD_MS) {
      // 超过阈值（60s），判定作弊 → status = FAILED
    } else {
      // 短切屏，从剩余时间中扣除隐藏时长
    }
  }
});
```

**三层防御设计**：

| 层 | 机制 | 目的 |
|---|---|---|
| 即时检测 | `visibilitychange` 监听，切出立即记录时间戳 | 不放过任何一次切换 |
| 阈值判定 | 累计隐藏时间 > 60s → 直接判定 FAILED | 防止"我只看一眼微信"的钻空子 |
| 时间补偿 | 短切屏时，从剩余专注时间中扣除隐藏时长 | 确保实际专注时长 = 番茄钟时长 - 切屏时间 |

**为什么用 `requestAnimationFrame` 而非 `setInterval`？**

这是一个容易被忽视的细节。浏览器为了省电，当页面被隐藏时会大幅降低 `setInterval` 的触发频率（Chrome 限制为 1 次/秒甚至更低）。而 `requestAnimationFrame` 在页面不可见时也会暂停，正因如此，**我们不能依赖定时器的"滴答"次数来计算时间**，而是：

**时间增量计数法**（替代固定步长累加）：

```typescript
// 每帧记录当前时间戳，与上一帧的差值即为真实流逝时间
const now = Date.now();
const delta = now - lastTickRef.current;  // 精确到毫秒
elapsedRef.current += delta;
lastTickRef.current = now;
```

这套方案的优雅之处在于：无论浏览器如何节制定时器，`Date.now()` 总是返回真实时间，时间增量始终准确。

> **面试一问**：为什么不用 `performance.now()`？——`Date.now()` 和 `performance.now()` 在这个场景都可选，区别是 `performance.now()` 受系统休眠影响会重置，而 `Date.now()` 基于系统时钟。对于专注倒计时，`Date.now()` 更可靠，因为即使合盖休眠，恢复后的时间差也能被正确计算。

---

## 四、核心业务二：笔记与任务

### 4.1 艾宾浩斯遗忘曲线与复习计划

**数学建模**：

```
保留率 R(t) = e ^ (-t / T)
  其中 T = D × (1 + reviewCount × M)
  
  经验公式: retentionRate = Math.exp(-elapsedDays / (1 + reviewCount * 2))
```

**定性理解**：
- `elapsedDays` = 距离上次复习的天数（越大，遗忘越多）
- `reviewCount` = 复习次数（越大，记忆越牢固）
- 每次复习后，时间常数 T 增大，遗忘曲线衰减变缓

**复习间隔（Ebbinghaus 经验值）**：

```typescript
const INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120]; // 天数
```

每次 `reviewNote` 调用时，根据当前 `reviewCount` 从间隔数组中取出下一个间隔天数，计算出 `nextReviewAt`。

**UI 提醒机制**：
- 后端 `GET /notes/due` 查询 `nextReviewAt <= now()` 的笔记
- 前端每 60s 自动轮询，卡片用红色边框 + "已逾期 X 天" 标签突出显示
- `reviewCount >= INTERVALS.length` 时不再安排复习——该知识点已进入长期记忆

### 4.2 任务模块设计

**双类型任务**：
- `SHORT_TERM`：短期任务，无时间线压力
- `LONG_TERM`：长期任务，需要持续跟踪

**CRUD 思路**：Task 模块是最标准化的 RESTful 资源，没有复杂的状态计算，所以设计上聚焦于：
- 纯粹的 REST 路由设计（POST + GET + PUT + DELETE + PATCH/toggle）
- `toggleTask` 是唯一业务特化的端点，避免前端做"读取当前状态 → 取反 → 写回"的三步操作（有并发竞态风险）
- `GET /tasks/stats` 做聚合查询（total / completed / pending / shortTerm / longTerm），一次查询返回所有统计，避免前端多次请求后自行计算

---

## 五、安全与认证：JWT 全链路打通

### 5.1 架构总览

```
┌─────────────────────────────────────────────────────┐
│                    前端 (React SPA)                    │
│                                                       │
│  AuthContext (user/token/login/logout/ready)          │
│       │                                               │
│       ├── localStorage.getItem('st-token')          │
│       ├── api/client.ts: 自动注入 Authorization 头    │
│       └── RequireAuth: 无 token → <Navigate /login>   │
│                                                       │
│  401 响应 → clearAuth() → window.location = /login    │
└──────────────────────┬────────────────────────────────┘
                       │ Bearer Token
                       ▼
┌──────────────────────────────────────────────────────┐
│                  后端 (Express)                        │
│                                                       │
│  authenticate 中间件:                                  │
│    1. 从 Authorization 头提取 Bearer Token             │
│    2. jwt.verify(token, SECRET)                        │
│    3. req.userId = payload.userId                      │
│    4. next() / 401                                    │
│                                                       │
│  路由结构:                                             │
│    /api/auth/*      → 公开（无中间件）                  │
│    /api/notes/*     → authenticate                     │
│    /api/tasks/*     → authenticate                     │
│    /api/focus/*     → authenticate                     │
│    /api/quote/*     → authenticate (预留)              │
└──────────────────────────────────────────────────────┘
```

### 5.2 前端 Token 持久化策略

**为什么用 `localStorage` 而非 `httpOnly Cookie`？**

这是一个经典的安全权衡：

| 方案 | XSS 防护 | CSRF 防护 | 实现复杂度 |
|---|---|---|---|
| httpOnly Cookie | 天然免疫 | 需 CSRF Token | 低 |
| localStorage Bearer Token | 需自行防 XSS | 天然免疫（手动发 header）| 中 |

选择 `localStorage` 的核心原因：**前后端分离的 SPA 架构中，手动管理 Bearer Token 可以避免 CSRF 攻击，且与部署架构解耦**（未来迁移到小程序、React Native 时认证逻辑无需改造）。

**实现要点**：
- 注册/登录成功 → `localStorage.setItem('st-token', token)` + `setState(user)`
- 退出 → `localStorage.removeItem('st-token')` + `setState(null)`
- 每次 API 调用从 `localStorage` 读取 token，注入到 `Authorization` 头
- 服务端返回 401 → 前端自动清除 token 并跳转 `/login`

### 5.3 路由守卫机制

`RequireAuth` 组件是 React Router 的布局路由守卫：

```
<Route element={<RequireAuth />}>
  <Route element={<DashboardLayout />}>
    <Route path="/notes" ... />
    <Route path="/focus" ... />
    <Route path="/tasks" ... />
  </Route>
</Route>
```

**内部逻辑**：
1. `AuthContext.ready === false` → 渲染加载状态（避免闪白屏）
2. `!token && ready` → `<Navigate to="/login" replace />`
3. `token && ready` → `<Outlet />` 渲染子路由

**加载状态为何必要？** 因为 `AuthContext` 初始化时需要从 `localStorage` 异步读取 token。如果不加 `ready` 屏障，首次渲染时 token 尚未读取到状态，会导致已登录用户瞬间看到登录页再跳转——"闪白屏"体验。

### 5.4 后端 JWT 中间件

```typescript
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401);

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);  // jwt.verify with secret
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}
```

**为什么 `Bearer ` 前缀不能省略？** HTTP 认证规范（RFC 6750）要求 Bearer Token 必须带 `Bearer ` 前缀。这个前缀是一个"协议信号"，区分不同类型的认证方案（Basic Token、Digest Token、Bearer Token）。它不仅是一个习惯，更是一个安全约定——避免 Token 被误解析为其他类型的凭证。

### 5.5 全链路 E2E 验证

最终的测试用例覆盖了 6 个维度 21 个场景，全部 21/21 通过：

1. **注册成功** → 201 + Token + User
2. **重复注册校验** → username 重 409、email 重 409
3. **登录/错误密码** → 200 + Token / 401
4. **未认证访问保护路由** → 三个业务 API 全部 401
5. **带 Token 正常业务流程** → Note / Task / FocusSession / Quote 全部 CRUD 成功
6. **伪造/过期 Token 拒绝** → 401

---

## 六、部署架构：Docker 容器化

### 6.1 生产架构

```
                      Nginx (80)
                    ┌────────────┐
                    │ React SPA  │  → try_files /index.html
                    │ 静态资源    │  → /assets/ 强缓存 1年
                    └─────┬──────┘
                          │ /api/ 反代
                          ▼
                    Express :3001
                    ┌────────────┐
                    │ Prisma ORM │  → prisma db push
                    └─────┬──────┘
                          │
                          ▼
                   PostgreSQL 16
                    ┌────────────┐
                    │ pgdata 卷  │  ← 持久化
                    └────────────┘
```

### 6.2 关键配置决策

**Nginx SPA 路由**：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

`$uri ` → `$uri/` → `/index.html` 的三级回退机制：
1. 先匹配精确文件（如 `/logo.png`）
2. 再匹配目录（如 `/notes/`）
3. 都失败则 fallback 到 `index.html`，由 React Router 接管路由

**Prisma db push vs migrate**：生产环境选择 `prisma db push` 而非 `prisma migrate deploy`，因为 Schema 在开发阶段使用 SQLite，migration 历史文件中的 SQL 方言不兼容 PostgreSQL。`db push` 直接从 Schema 推断出目标数据库的 DDL，**在首次部署时的最佳选择**。Schema 稳定后应切换到正式迁移工作流。

---

## 七、避坑备忘录

| # | 坑 | 原因 | 解决方案 |
|---|---|---|---|
| 1 | Prisma SQLite 不支持 enum | SQLite 是弱类型数据库 | `String @default("USER")` 替代 Prisma Enum |
| 2 | Prisma Provider 不支持 env() 动态切换 | Prisma 设计决定（影响 Client 类型） | 维护两份 Schema 文件，Dockerfile 构建时替换 |
| 3 | 外键删除约束 | Prisma `@relation` 默认 `NoAction` | 显式声明 `onDelete: Cascade` |
| 4 | `new URL(path, base)` 丢失 base path | URL 解析规范：绝对路径 `/x` 替换 base 的 path | 保证 path 不含前导 `/`，或在 base 中带够路径层级 |
| 5 | Vite 代理在生产环境不工作 | Vite proxy 是开发服务器专用 | 生产使用 Nginx 反向代理 |
| 6 | 浏览器隐藏标签时 setInterval 节流 | 浏览器省电策略 | 使用 `Date.now()` 增量计数法替代固定步长 |
| 7 | 登录后闪白屏 | AuthContext 初始化时 token 未就绪 | 添加 `ready` 状态，就绪前渲染 loading |
| 8 | 注册时 `Bearer ` 前缀重复 | 测试脚本手动传递了带 `Bearer` 前缀的 token | 客户端自动加前缀，传递裸 Token |
| 9 | npm install 安装在了错误目录 | context 混淆 | 始终保持 `cd frontend && npm install` 在正确目录 |
| 10 | 旧进程占用端口 | 开发服务器重启后端口未释放 | Windows 用 `taskkill -F -PID`，Linux 用 `fuser -k` |
| 11 | Prisma `jsonwebtoken` SignOptions 类型不兼容 | `@types/jsonwebtoken` 严格模式 | `as jwt.SignOptions` 类型断言 |
| 12 | `dist/` 是 .gitignore 但被 .dockerignore | 多阶段构建中 dist 需要重建 | 在 Docker build 中重新 `npm run build` |

---

## 八、总结：架构哲学

这个项目虽然是一个学习工具，但在架构设计上遵循了三条核心原则：

1. **开发效率优先**：SQLite 开发 / Postgres 生产、Vite 快速 HMR、Tailwind 原子化样式——每一个选择都在减少从"想法"到"看到结果"的循环时间。

2. **安全不是装饰**：JWT 认证从第一天就介入，而非后期"打补丁"；防作弊体系在定时器设计时就被内建，而非测试阶段发现漏洞再修复。

3. **状态机驱动 UI**：计时器的 idle/running/paused/completed/failed 状态机、认证的 loading/authenticated/unauthenticated 三态——用状态机穷举所有可能的 UI 状态，是消灭"不可能出现的 bug"的最有效手段。
