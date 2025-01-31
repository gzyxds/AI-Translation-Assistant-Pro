import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { authOptions } from '../../auth/[...nextauth]/auth'

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (typeof name !== 'string' || name.length > 50) {
      return new NextResponse('Invalid name', { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    // 更新用户名
    await sql`
      UPDATE auth_users
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${session.user.email}
    `

    return new NextResponse('OK')
  } catch (error) {
    console.error('Failed to update user:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 