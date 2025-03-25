import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { neon } from '@neondatabase/serverless'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('收到 Stripe Webhook 请求')
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  let event

  try {
    if (!stripe) {
      console.error('Stripe 未配置')
      return new NextResponse('Stripe is not configured', { status: 500 })
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      webhookSecret
    )
    console.log('Webhook 事件验证成功:', event.type)
  } catch (err: any) {
    console.error('Webhook 签名验证失败:', err)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId
        const priceId = subscription.items.data[0].price.id

        console.log('处理订阅事件:', {
          type: event.type,
          userId,
          priceId,
          customerId: subscription.customer,
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        })

        // 根据价格ID设置对应的配额
        const quotaUpdate = priceId === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ? {
          text_quota: -1,
          image_quota: 50,
          pdf_quota: 40,
          speech_quota: 30,
          video_quota: 10
        } : priceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID ? {
          text_quota: -1,
          image_quota: 100,
          pdf_quota: 80,
          speech_quota: 60,
          video_quota: 20
        } : {
          text_quota: -1,
          image_quota: 10,
          pdf_quota: 8,
          speech_quota: 5,
          video_quota: 2
        }

        console.log('执行数据库更新:', {
          customerId: subscription.customer,
          subscriptionId: subscription.id,
          priceId: subscription.items.data[0].price.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          quotaUpdate
        })

        // 更新用户订阅状态和配额
        const updateResult = await sql`
          UPDATE auth_users 
          SET 
            stripe_customer_id = ${subscription.customer},
            stripe_subscription_id = ${subscription.id},
            stripe_price_id = ${subscription.items.data[0].price.id},
            stripe_current_period_end = to_timestamp(${subscription.current_period_end}),
            text_quota = ${quotaUpdate.text_quota},
            image_quota = ${quotaUpdate.image_quota},
            pdf_quota = ${quotaUpdate.pdf_quota},
            speech_quota = ${quotaUpdate.speech_quota},
            video_quota = ${quotaUpdate.video_quota}
          WHERE id = ${userId}
          RETURNING *
        `
        console.log('数据库更新结果:', updateResult[0])
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId

        // 重置用户为免费计划
        await sql`
          UPDATE auth_users 
          SET 
            stripe_subscription_id = NULL,
            stripe_price_id = NULL,
            stripe_current_period_end = NULL,
            text_quota = -1,
            image_quota = 5,
            pdf_quota = 3,
            speech_quota = 2,
            video_quota = 1
          WHERE id = ${userId}
        `
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = subscription.metadata.userId

        // 更新发票支付状态
        await sql`
          INSERT INTO payment_history (
            user_id,
            stripe_invoice_id,
            amount,
            status,
            payment_date
          ) VALUES (
            ${userId},
            ${invoice.id},
            ${invoice.amount_paid},
            'succeeded',
            to_timestamp(${invoice.created})
          )
        `
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = subscription.metadata.userId

        // 记录支付失败
        await sql`
          INSERT INTO payment_history (
            user_id,
            stripe_invoice_id,
            amount,
            status,
            payment_date
          ) VALUES (
            ${userId},
            ${invoice.id},
            ${invoice.amount_due},
            'failed',
            to_timestamp(${invoice.created})
          )
        `

        // 可以在这里添加通知用户的逻辑
        break
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (error: any) {
    console.error('Webhook handler failed:', error)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
} 