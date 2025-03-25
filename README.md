# AI 翻译助手

一个功能强大的 AI 驱动的多语言翻译和内容处理平台。

## 主要功能

### 1. 多模态翻译
- **文本翻译**：支持无限次免费文本翻译，多种语言互译
- **图片识别**：支持图片内容识别和翻译，可处理多种格式图片
- **PDF 处理**：支持 PDF 文档内容提取和翻译，优化的文本提取算法
- **语音识别**：支持语音内容识别和转换，多种语言支持
- **视频处理**：支持视频内容提取和字幕生成，自动时间轴对齐

### 2. 高级 AI 模型支持
- **多模型集成**：支持 GPT、Gemini、Kimi、Mistral 等多种 AI 模型
- **智能模型选择**：根据内容类型自动选择最佳模型处理
- **模型备份机制**：当主要模型失败时自动切换到备用模型
- **高质量翻译**：专业级翻译质量，保留原文格式和语义

### 3. 会员订阅系统
- **分级会员制**：支持试用版、月度会员和年度会员
- **差异化配额**：不同会员等级享有不同的服务配额
- **自动续期**：支持 Stripe 订阅自动续费
- **订阅管理**：支持查看订阅状态、到期时间等
- **订阅过期处理**：订阅到期后自动重置为试用版状态

### 4. 用户系统
- **账号管理**：支持邮箱注册和登录
- **社交登录**：支持 GitHub 和 Google 账号登录
- **个人资料**：支持修改用户名等基本信息
- **使用统计**：实时显示各项功能的使用情况

### 5. 配额管理
- **每日重置**：免费用户的使用配额每日0点自动重置
- **实时统计**：显示当日各项功能的剩余使用次数
- **配额升级**：付费会员可获得更多使用次数
  - **试用版**：
    - 无限文本翻译
    - 5次/日图片识别
    - 3次/日PDF处理
    - 2次/日语音识别
    - 1次/日视频处理
  - **月度会员**：
    - 无限文本翻译
    - 50次/日图片识别
    - 40次/日PDF处理
    - 30次/日语音识别
    - 10次/日视频处理
  - **年度会员**：
    - 无限文本翻译
    - 100次/日图片识别
    - 80次/日PDF处理
    - 60次/日语音识别
    - 20次/日视频处理

### 6. 性能优化
- **PDF处理优化**：
  - 多种文本提取方法，提高成功率
  - 备用处理机制，当OCR API失败时使用聊天API提取内容
  - 减少重试次数和等待时间，提升用户体验
- **响应式设计**：适配各种设备屏幕尺寸
- **多语言界面**：支持中英文界面切换
- **快速响应**：优化的API调用和缓存机制

## 技术栈

- **前端**：Next.js 14, React, TypeScript, Tailwind CSS
- **后端**：Node.js, PostgreSQL (Neon Serverless)
- **认证**：NextAuth.js
- **支付**：Stripe
- **国际化**：自定义i18n解决方案
- **云服务**：
  - 阿里云 OSS（文件存储）
  - 腾讯云（AI 服务）
  - 多种AI模型API集成

## 环境变量配置

项目运行需要配置以下环境变量：

```env
# 数据库配置
DATABASE_URL=

# 认证相关
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# GitHub OAuth
GITHUB_ID=
GITHUB_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe 配置
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=
NEXT_PUBLIC_APP_URL=

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
ALIYUN_OSS_BUCKET=
ALIYUN_OSS_REGION=
ALIYUN_RAM_ROLE_ARN=

# AI 模型 API Keys
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_DEEPSEEK_API_KEY=
NEXT_PUBLIC_QWEN_API_KEY=
NEXT_PUBLIC_ZHIPU_API_KEY=
NEXT_PUBLIC_TENCENT_API_KEY=
NEXT_PUBLIC_KIMI_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
NEXT_PUBLIC_MINNIMAX_API_KEY=
NEXT_PUBLIC_SILICONFLOW_API_KEY=
NEXT_PUBLIC_OPENROUTER_API_KEY=
MISTRAL_API_KEY=
```

## 开发说明

1. 克隆项目
```bash
git clone [repository-url]
cd ai-translation-assistant-pro
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 填入相应的值
```

4. 运行开发服务器
```bash
npm run dev
```

## 部署

项目可以部署到任何支持 Node.js 的平台。建议使用 Vercel 进行部署：

1. 在 Vercel 中导入项目
2. 配置环境变量
3. 部署完成后即可访问

## 许可证

[MIT License](LICENSE) 