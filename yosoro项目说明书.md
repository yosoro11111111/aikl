# Yosoro - 3D 沉浸式 AI 伴侣项目

Yosoro 是一个基于 Next.js 和 React Three Fiber 构建的 3D 沉浸式 AI 伴侣应用。它结合了先进的 Web 3D 技术和 AI 对话能力，为您提供一个生动、可爱且互动性极强的虚拟伙伴“露米娜”。

![Project Preview](public/file.svg) <!-- 这里可以替换为实际的项目截图 -->1

## ✨ 核心特性

### 1. 3D 沉浸式交互
- **全方位模型展示**：使用 VRM 标准模型，支持全身 360 度观察。
- **全身触控反馈**：
  - **精准部位识别**：头部、脸部、胸部、手臂、腿部等全身关键部位均添加了隐形碰撞箱，点击无死角。
  - **差异化反应**：抚摸头部会增加好感度（爱心粒子爆发），触碰敏感部位（如胸部）会有害羞或生气的反应。
- **镜头聚焦与晃动**：
  - **智能聚焦**：点击头部或脸部时，镜头自动平滑推进特写。
  - **手持摄影感**：待机状态下镜头带有轻微呼吸感晃动（Camera Shake），增强真实感。
- **视觉增强**：集成 Bloom 后期泛光、接触阴影（Contact Shadows）和环境光照，打造梦幻的二次元画面。

### 2. AI 智能对话与情感
- **自然语言对话**：基于 LLM（大型语言模型）的智能回复，支持连续对话。
- **语音输入**：支持麦克风语音转文字输入，沟通更便捷。
- **情感同步**：
  - **表情联动**：AI 的回复会带有情感标签（如 `[emotion:shy]`），模型表情实时同步变化。
  - **口型同步**：模型嘴型会根据说话内容自动开合，模拟真实说话状态。

### 3. 丰富的动作与互动
- **20+ 种动作库**：内置招手、跳舞、睡觉、生气、鞠躬、胜利等 20 种动作，可随时通过菜单触发。
- **闲置动画系统**：待机时模型会自动伸懒腰、四处张望或轻轻摇晃，拒绝呆板。
- **交互音效**：点击、抚摸、发送消息均有可爱的“Pop”、“Cute”风格音效反馈。

### 4. 换装与场景系统
- **多场景切换**：支持温馨小屋、夏日海滩、都市夜景等多种背景环境。
- **模型切换**：支持加载不同的 VRM 模型角色。

## 🛠️ 技术栈

- **核心框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **3D 引擎**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js 的 React 封装)
- **模型加载**: [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) (VRM 格式支持)
- **动画库**: [Framer Motion](https://www.framer.com/motion/) (UI 动画)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand) (轻量级全局状态管理)
- **UI 组件**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) (图标)
- **后期处理**: [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)

## 📂 项目结构

```
src/
├── app/                  # Next.js App Router 路由与页面
│   ├── api/chat/         # AI 对话 API 接口
│   ├── page.tsx          # 主页面入口
│   └── layout.tsx        # 全局布局
├── components/           # React 组件
│   ├── Avatar.tsx        # 核心：VRM 模型加载与骨骼交互逻辑
│   ├── Scene.tsx         # 3D 场景配置（灯光、相机、后期）
│   ├── ChatInterface.tsx # 对话 UI、语音输入与动作菜单
│   ├── Particles.tsx     # 粒子特效系统
│   ├── SettingsPanel.tsx # 设置面板（换模型、换场景）
│   └── ...
├── hooks/                # 自定义 Hooks
│   ├── useInteractionManager.ts # 核心：处理点击、抚摸、好感度逻辑
│   ├── useAnimationManager.ts   # 核心：处理表情、动作、口型动画
│   └── useSoundManager.ts       # 音效播放管理
├── store/
│   └── useStore.ts       # Zustand 全局状态定义（情感、动作、配置）
└── config.ts             # 交互配置文件（部位定义、好感度数值）
```

## 🚀 快速开始

### 1. 环境准备
确保您的环境已安装 Node.js (推荐 v18+)。

### 2. 安装依赖
```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env.local` 并填入您的 API Key（如果需要）：
```env
OPENAI_API_KEY=your_api_key_here
```

### 4. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始体验。

## 🎮 如何使用

1.  **对话**：在底部输入框输入文字，或点击麦克风图标进行语音输入。
2.  **互动**：
    *   **抚摸**：点击或拖拽模型的头部、身体等部位。
    *   **动作**：点击输入框左侧的 ✨ 图标，选择想要播放的动作。
    *   **重置**：点击右上角的还原图标，重置相机视角。
3.  **设置**：点击左下角的设置图标，可以切换背景场景或更换模型。

## 📝 开发指南

*   **修改交互逻辑**：编辑 `src/config.ts` 和 `src/hooks/useInteractionManager.ts`。
*   **添加新动作**：在 `src/store/useStore.ts` 的 `Action` 类型中添加动作名，并在 `src/hooks/useAnimationManager.ts` 中实现具体的骨骼动画逻辑。
*   **调整 3D 效果**：编辑 `src/components/Scene.tsx` 调整灯光、阴影和后期处理参数。

---
*Created with ❤️ by Trae AI*
