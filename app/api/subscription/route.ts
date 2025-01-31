import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { authOptions } from '../auth/[...nextauth]/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { priceId } = await req.json()
    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 })
    }

    if (!stripe) {
      return new NextResponse('Stripe is not configured', { status: 500 })
    }

    // 检查价格 ID 是否有效
    const paidPlans = [PLANS.monthly, PLANS.yearly]
    const plan = paidPlans.find(p => p.priceId === priceId)
    if (!plan) {
      return new NextResponse('Invalid price ID', { status: 400 })
    }

    // 创建或获取 Stripe 客户
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: {
        userId: session.user.id
      }
    })

    // 创建结账会话
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Subscription error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 