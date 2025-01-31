import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// 检查配额是否足够
async function checkQuota(userId: number, type: string) {
  const quotaField = `${type}_quota`
  
  // 获取用户配额信息
  const result = await sql`
    SELECT ${sql(quotaField)}, quota_reset_at
    FROM auth_users
    WHERE id = ${userId}
  `
  
  if (result.length === 0) {
    throw new Error('用户不存在')
  }

  const user = result[0]
  const today = new Date().toISOString().split('T')[0]

  // 如果是新的一天，重置配额
  if (user.quota_reset_at !== today) {
    const defaultQuotas = {
      text: -1,
      image: 10,
      pdf: 8,
      speech: 5,
      video: 2
    }

    await sql`
      UPDATE auth_users
      SET 
        image_quota = ${defaultQuotas.image},
        pdf_quota = ${defaultQuotas.pdf},
        speech_quota = ${defaultQuotas.speech},
        video_quota = ${defaultQuotas.video},
        quota_reset_at = ${today}
      WHERE id = ${userId}
    `
    
    return defaultQuotas[type as keyof typeof defaultQuotas]
  }

  return user[quotaField]
}

// 获取今日使用次数
async function getUsageCount(userId: number, type: string) {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM usage_records
    WHERE user_id = ${userId}
      AND type = ${type}
      AND DATE(used_at) = CURRENT_DATE
  `
  return parseInt(result[0].count)
}

// 记录使用并减少配额
async function recordUsage(userId: number, type: string) {
  console.log('开始记录使用情况:', { userId, type })
  
  try {
    // 开始事务
    await sql`BEGIN`

    try {
      // 插入使用记录
      await sql`
        INSERT INTO usage_records (user_id, type)
        VALUES (${userId}, ${type})
      `
      console.log('使用记录已插入')

      // 如果不是无限制配额，减少剩余次数
      if (type !== 'text') {
        // 根据类型选择不同的更新语句
        let updateResult;
        switch (type) {
          case 'image':
            updateResult = await sql`
              UPDATE auth_users 
              SET image_quota = GREATEST(image_quota - 1, 0),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${userId}
              RETURNING image_quota as remaining_quota
            `
            break;
          case 'pdf':
            updateResult = await sql`
              UPDATE auth_users 
              SET pdf_quota = GREATEST(pdf_quota - 1, 0),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${userId}
              RETURNING pdf_quota as remaining_quota
            `
            break;
          case 'speech':
            updateResult = await sql`
              UPDATE auth_users 
              SET speech_quota = GREATEST(speech_quota - 1, 0),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${userId}
              RETURNING speech_quota as remaining_quota
            `
            break;
          case 'video':
            updateResult = await sql`
              UPDATE auth_users 
              SET video_quota = GREATEST(video_quota - 1, 0),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${userId}
              RETURNING video_quota as remaining_quota
            `
            break;
        }
        console.log('配额已更新，剩余:', updateResult?.[0]?.remaining_quota)
      }

      // 提交事务
      await sql`COMMIT`
      console.log('事务已提交')
    } catch (error) {
      // 如果出错，回滚事务
      await sql`ROLLBACK`
      console.error('事务回滚:', error)
      throw error
    }
  } catch (error) {
    console.error('记录使用情况失败:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('当前会话:', session?.user)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const { type } = await req.json()
    
    if (!type || !['text', 'image', 'pdf', 'speech', 'video'].includes(type)) {
      return NextResponse.json(
        { error: '无效的使用类型' },
        { status: 400 }
      )
    }

    // 获取用户ID
    const users = await sql`
      SELECT id FROM auth_users WHERE email = ${session.user.email}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const userId = users[0].id

    // 检查配额
    const quota = await checkQuota(userId, type)
    const usageCount = await getUsageCount(userId, type)

    // 如果是无限制配额，直接记录使用
    if (quota === -1) {
      await recordUsage(userId, type)
      return NextResponse.json({
        success: true,
        remaining: -1
      })
    }

    // 计算剩余次数
    const remainingQuota = quota - usageCount

    console.log('配额检查:', {
      type,
      quota,
      usageCount,
      remainingQuota
    })

    // 如果没有剩余次数，返回错误
    if (remainingQuota <= 0) {
      return NextResponse.json(
        { error: '今日使用次数已达上限' },
        { status: 403 }
      )
    }

    // 记录使用
    await recordUsage(userId, type)

    // 返回更新后的配额信息
    console.log('更新后的配额:', {
      type,
      quota,
      usageCount: usageCount + 1,
      remaining: remainingQuota - 1
    })

    return NextResponse.json({
      success: true,
      remaining: remainingQuota - 1
    })

  } catch (error: any) {
    console.error('记录使用情况失败:', error)
    return NextResponse.json(
      { error: error.message || '记录使用失败' },
      { status: 500 }
    )
  }
} 