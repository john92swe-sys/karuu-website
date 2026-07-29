# AGENTS.md — KARUU AB Official Website

## Project Overview
KARUU AB 官方品牌官网，北欧简约商务风格的单页静态网站，涵盖 8 个核心板块。基于 `native-static` 模板，纯 HTML + CSS + JavaScript，零依赖。

## Tech Stack
- **Template**: native-static (coze init)
- **HTML**: 语义化 HTML5
- **CSS**: 原生 CSS (无框架)，自定义属性 (CSS Custom Properties) 管理主题
- **Fonts**: Google Fonts (Montserrat + Roboto + Playfair Display + Inter)，通过 `fonts.googleapis.cn` 加载
- **JS**: 原生 JavaScript (无框架)

## Key Sections (8 个板块)
1. **Hero** — 首页大 Banner
2. **About** — 公司介绍 + 注册信息 + 团队 + 价值观
3. **Services** — 6 大服务体系 + 服务流程
4. **Products** — 猫爬架 / 烧烤炉 / 水杯 + OEM 服务 (表格展示)
5. **Cases** — 成功案例 (挑战-方案-结果结构)
6. **Why Us** — 6 大优势 + CTA 区域
7. **Cooperation** — 4 种合作模式 + 需求表格
8. **Contact** — 联系信息 + 表单 + 办公时间

## Color Palette (Swedish Modern Style)
- Primary: `#1A3A5C` (Deep Nordic Blue)
- Secondary: `#4A90A4` (Scandinavian Teal)
- Accent: `#E8B849` (Swedish Gold)
- Background: `#FFFFFF`, Light Gray: `#F5F7FA`
- Text: `#2C3E50` (Dark Charcoal)

## Project Structure
```
/workspace/projects/
├── index.html          # 主页面 (1384 行嵌入式全部内容)
├── styles/
│   └── main.css        # 模板默认样式 (未使用)
├── .coze               # 项目配置文件
└── AGENTS.md           # 本文件
```

## Build & Run
- Dev: `coze dev` (自动启动 HTTP 静态服务器, 端口 5000)
- No build step required (纯静态 HTML)
- HMR 依赖手动刷新

## Key Features
- 固定导航栏 (scroll 时加阴影)
- 移动端汉堡菜单
- 滚动渐入动画 (Intersection Observer)
- 导航高亮跟随滚动位置
- 返回顶部按钮
- 联系表单 (客户端提交展示)
- 完整的产品数据表格

## Common Fixes
- **样式问题**: 所有 CSS 位于 index.html 的 `<style>` 块中，CSS 变量在 `:root` 中集中管理
- **字体加载慢**: 使用 `fonts.googleapis.cn` (CN 镜像) + `preconnect` 优化
- **响应式**: 已内置 768px / 900px / 520px 断点