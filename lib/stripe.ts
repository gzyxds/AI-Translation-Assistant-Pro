import Stripe from 'stripe'

// 服务器端 Stripe 实例
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null

// 客户端 Stripe 配置
export const getStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js')
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  return stripePromise
}

export const PLANS = {
  free: {
    name: '试用版',
    description: '体验基础功能',
    price: '$0',
    features: {
      basic: [
        '无限文本翻译',
        '每日10次图片识别',
        '每日8次PDF处理'
      ],
      advanced: [
        '每日5次语音识别',
        '每日2次视频处理'
      ],
      support: [
        '基础客服支持'
      ]
    },
    quota: {
      text_quota: -1,
      image_quota: 10,
      pdf_quota: 8,
      speech_quota: 5,
      video_quota: 2
    }
  },
  monthly: {
    name: '月度会员',
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
    description: '适合个人日常使用',
    price: '$9.99/月',
    features: {
      basic: [
        '无限文本翻译',
        '每日50次图片识别',
        '每日40次PDF处理'
      ],
      advanced: [
        '每日30次语音识别',
        '每日10次视频处理',
        '优先处理队列'
      ],
      support: [
        '优先客服支持'
      ]
    },
    quota: {
      text_quota: -1,
      image_quota: 50,
      pdf_quota: 40,
      speech_quota: 30,
      video_quota: 10
    }
  },
  yearly: {
    name: '年度会员',
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
    description: '最超值的选择',
    price: '$99.99/年',
    isRecommended: true,
    features: {
      basic: [
        '无限文本翻译',
        '每日100次图片识别',
        '每日80次PDF处理'
      ],
      advanced: [
        '每日60次语音识别',
        '每日20次视频处理',
        '优先处理队列'
      ],
      support: [
        '24/7专属客服',
        '高级API访问'
      ]
    },
    quota: {
      text_quota: -1,
      image_quota: 100,
      pdf_quota: 80,
      speech_quota: 60,
      video_quota: 20
    }
  }
} as const 