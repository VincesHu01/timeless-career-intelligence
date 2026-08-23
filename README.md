# Timeless

Timeless 是面向中国大陆大学生与应届生的互联网产品/运营岗位情报与 AI 学习系统。它以官方招聘证据为基础，提供岗位历史库、能力 × 公司透视、岗位合并洞察、趋势周报、AI 技术栈学习和艾宾浩斯复习提醒。

## 技术架构

- React 19 + Next.js App Router；同一源码支持 Next.js/Vercel 与 Vinext/OpenAI Sites。
- TypeScript、响应式 CSS、Canvas 粒子编队。
- Drizzle ORM + Cloudflare D1；Vercel 通过 D1 官方 REST API 访问同一 SQLite 数据模型。
- Supabase Auth；浏览器只使用 publishable key，服务端校验用户 JWT。
- 火山方舟 OpenAI-compatible Chat Completions API。
- 浏览器 Notification / Service Worker 复习提醒与本地历史偏好。

## 本地运行

要求 Node.js `>=22.13.0`。

```bash
npm ci
cp .env.example .env.local
npm run dev:vercel
```

打开 `http://localhost:3000`。首次运行前请按下文准备数据库并补全 `.env.local`。

## 需要配置的密钥

1. **Supabase Auth**：填写 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。在 Supabase Authentication 中开启 Email 登录，并把本地及生产域名加入 Redirect URLs。
2. **火山方舟**：填写 `ARK_API_KEY`、实际 endpoint/model ID `ARK_MODEL_ID`；默认 API 根地址为 `https://ark.cn-beijing.volces.com/api/v3`。
3. **Cloudflare D1**：创建 D1 数据库，并创建仅包含该账号 `D1 Read`、`D1 Write` 权限的 API Token，填写三个 `CLOUDFLARE_*` 变量。
4. **定时接口密钥**：为 `CORTEX_CRON_SECRET`、`CORTEX_BACKFILL_SECRET` 生成不可预测的随机值。

任何 secret、方舟 API Key、D1 API Token 都不得提交到 Git。`NEXT_PUBLIC_*` 会进入浏览器，只能放 Supabase publishable key，不能放 service role/secret key。

## 初始化 D1

把 Cloudflare 三个变量加载进当前终端后执行：

```bash
npm run db:setup:remote
```

脚本会按顺序执行 `drizzle/` 中的全部迁移。之后运行 `npm run dev:vercel`，访问 `/api/jobs` 应返回 JSON，而不是数据库配置错误。

## 部署到 Vercel

1. Fork/clone 本仓库并在 Vercel 导入。
2. 将 `.env.example` 中除 `TIMELESS_BACKEND_ORIGIN` 外的变量添加到 Production、Preview、Development。
3. Build Command 使用 `npm run build:vercel`，Install Command 使用 `npm ci`（仓库中的 `vercel.json` 已配置）。
4. 部署后，把最终 `https://*.vercel.app` 域名加入 Supabase Auth Redirect URLs。

若已有一个完整运行的 Timeless 后端，也可以只设置 `TIMELESS_BACKEND_ORIGIN=https://你的后端域名`。Vercel 会把 `/api/*` 透明代理到该后端；此时不再填写远程 D1 凭据。

## OpenAI Sites / Cloudflare 构建

Sites 环境通过 `.openai/hosting.json` 注入 `DB` binding：

```bash
npm run dev
npm run build
```

Vercel 使用 `npm run build:vercel`。两条构建链共享 `app/`、API 路由和业务逻辑，不需要维护两份前端。

## 验证

```bash
npm run lint
npm run build
npm run build:vercel
npm test
```

采集器只应访问公司公开招聘页面/公开职位接口，并保留具体来源 URL、采集时间和证据原文。请在使用地遵守目标站点条款、robots 约束、速率限制与个人信息保护要求。
