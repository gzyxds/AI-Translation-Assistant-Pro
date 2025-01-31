import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { authOptions } from '../../auth/[...nextauth]/auth'

interface User {
  id: string;
  email: string;
  name: string | null;
  github_id: string | null;
  google_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
  text_quota: number;
  image_quota: number;
  pdf_quota: number;
  speech_quota: number;
  video_quota: number;
  quota_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

type UsageType = 'text' | 'image' | 'pdf' | 'speech' | 'video';

interface UsageRecord {
  type: UsageType;
  count: string;
}

interface UsageInfo {
  [key: string]: number;
  text: number;
  image: number;
  pdf: number;
  speech: number;
  video: number;
}

export async function GET() {
  try {
    console.log('开始获取用户信息')
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('未找到用户会话')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('用户邮箱:', session.user.email)
    const sql = neon(process.env.DATABASE_URL!)
    
    // 获取用户基本信息和订阅信息
    const users = await sql`
      SELECT 
        id,
        email,
        name,
        github_id,
        google_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        stripe_current_period_end,
        text_quota,
        image_quota,
        pdf_quota,
        speech_quota,
        video_quota,
        quota_reset_at,
        created_at,
        updated_at
      FROM auth_users 
      WHERE email = ${session.user.email}
    ` as User[]

    if (!users.length) {
      console.log('未找到用户记录')
      return new NextResponse('User not found', { status: 404 })
    }

    const user = users[0]
    console.log('查询到的用户信息:', {
      id: user.id,
      email: user.email,
      subscription: {
        customerId: user.stripe_customer_id,
        subscriptionId: user.stripe_subscription_id,
        priceId: user.stripe_price_id,
        currentPeriodEnd: user.stripe_current_period_end
      },
      quotas: {
        text: user.text_quota,
        image: user.image_quota,
        pdf: user.pdf_quota,
        speech: user.speech_quota,
        video: user.video_quota
      }
    })

    const today = new Date().toISOString().split('T')[0]
    console.log('当前日期:', today, '上次配额重置日期:', user.quota_reset_at)

    // 如果配额重置日期不是今天，根据用户的订阅计划重置配额
    if (user.quota_reset_at !== today) {
      console.log('重置用户配额，订阅计划:', user.stripe_price_id)
      
      let quotaUpdate
      if (user.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) {
        quotaUpdate = {
          text_quota: -1,
          image_quota: 50,
          pdf_quota: 40,
          speech_quota: 30,
          video_quota: 10
        }
      } else if (user.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID) {
        quotaUpdate = {
          text_quota: -1,
          image_quota: 100,
          pdf_quota: 80,
          speech_quota: 60,
          video_quota: 20
        }
      } else {
        quotaUpdate = {
          text_quota: -1,
          image_quota: 10,
          pdf_quota: 8,
          speech_quota: 5,
          video_quota: 2
        }
      }

      await sql`
        UPDATE auth_users
        SET 
          image_quota = ${quotaUpdate.image_quota},
          pdf_quota = ${quotaUpdate.pdf_quota},
          speech_quota = ${quotaUpdate.speech_quota},
          video_quota = ${quotaUpdate.video_quota},
          quota_reset_at = ${today}
        WHERE id = ${user.id}
      `
      
      user.text_quota = quotaUpdate.text_quota
      user.image_quota = quotaUpdate.image_quota
      user.pdf_quota = quotaUpdate.pdf_quota
      user.speech_quota = quotaUpdate.speech_quota
      user.video_quota = quotaUpdate.video_quota
      console.log('配额重置完成，新配额:', quotaUpdate)
    }

    // 获取今日使用次数
    console.log('开始获取今日使用次数')
    const usage = await sql`
      SELECT type, COUNT(*) as count
      FROM usage_records
      WHERE user_id = ${user.id}
        AND DATE(used_at) = CURRENT_DATE
      GROUP BY type
    ` as UsageRecord[]

    console.log('今日使用记录:', usage)

    // 构建响应数据
    const response = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        github_id: user.github_id,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      subscription: {
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        stripe_price_id: user.stripe_price_id,
        stripe_current_period_end: user.stripe_current_period_end
      },
      quota: {
        text_quota: user.text_quota,
        image_quota: user.image_quota,
        pdf_quota: user.pdf_quota,
        speech_quota: user.speech_quota,
        video_quota: user.video_quota
      },
      usage: {
        text: 0,
        image: 0,
        pdf: 0,
        speech: 0,
        video: 0
      } as UsageInfo
    }

    // 填充使用次数
    usage.forEach((record) => {
      response.usage[record.type] = parseInt(record.count)
    })

    console.log('返回的用户信息:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 