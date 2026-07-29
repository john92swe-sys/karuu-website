# DESIGN.md — KARUU AB

## 品牌与视觉方向
- 北欧简约商务风 (Swedish Modern / Nordic Minimalist)
- 干净、专业、信任感强

## Design Tokens

### 色彩
- Primary: `#1A3A5C` (Deep Nordic Blue)
- Secondary: `#4A90A4` (Scandinavian Teal)
- Accent: `#E8B849` (Swedish Gold)
- Background: `#FFFFFF` (Pure White), `#F5F7FA` (Light Gray)
- Text: `#2C3E50` (Dark Charcoal)
- Border: `#E8ECF0`
- Shadow: `rgba(26,58,92,0.08)` 起

### 字体
- Headings: `Montserrat`, `Open Sans` (clean, modern)
- Body: `Roboto`, `Inter` (professional, readable)
- Accent: `Playfair Display` (for decorative numerals)
- 通过 Google Fonts CN 镜像加载

### 圆角
- 卡片/区块: 12px
- 按钮/小元素: 6px

## 布局与响应式
- 单页滚动式布局 (One-page scroll)
- 固定导航栏 + 锚点跳转
- 桌面: 1200px 最大宽度居中
- 断点: 1024px (导航折叠), 900px (4列→2列), 768px (2列→1列), 520px (全单列)
- 间距: 90px 上下 padding (section), 24px 容器边距

## 组件规范
- 所有卡片 hover 时上移 + shadow 增强
- 按钮: 14px padding 水平 + 圆角, hover 上移 2px
- 数据表格: 首行 Nordic Blue 背景 + 白色文字, 斑马纹 hover
- 导航栏: 半透明毛玻璃效果 (backdrop-filter blur)

## 交互与状态
- 导航高亮: IntersectionObserver 监听滚动位置
- 渐入动画: scroll 触发 fade-up (translateY 24px → 0, opacity 0→1)
- 返回顶部: 滚动超过 500px 显示
- 表单提交: 客户端验证 + 成功提示 (无后端)
- 移动端: 汉堡菜单展开/收起

## 可访问性
- 语义化 HTML5 标签 (header, nav, section, footer)
- aria-label 用于图标按钮
- 足够的颜色对比度