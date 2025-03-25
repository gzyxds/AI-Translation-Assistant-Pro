import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)

export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password')
        }

        try {
          const result = await sql`
            SELECT * FROM auth_users WHERE email = ${credentials.email}
          `
          const user = result[0]
          console.log('查询到的用户数据:', user)

          if (!user || !user.password_hash) {
            throw new Error('Invalid email or password')
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash)
          console.log('密码比较结果:', isValid)
          
          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || null
          }
        } catch (error) {
          console.error('登录验证错误:', error)
          throw new Error('Authentication server error, please try again later')
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email!,
          image: profile.picture,
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      httpOptions: {
        timeout: 10000
      },
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email!,
          image: profile.avatar_url,
        }
      },
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      try {
        // 检查用户是否存在
        const users = await sql`
          SELECT id, email FROM auth_users
          WHERE email = ${user.email}
        `

        // 如果是首次登录，创建新用户
        if (users.length === 0 && account?.providerAccountId) {
          if (account.provider === 'github') {
            await sql`
              INSERT INTO auth_users (
                email,
                name,
                github_id,
                text_quota,
                image_quota,
                pdf_quota,
                speech_quota,
                video_quota,
                created_at,
                updated_at
              ) VALUES (
                ${user.email},
                ${user.name},
                ${account.providerAccountId},
                -1,
                10,
                8,
                5,
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )
            `
          } else {
            await sql`
              INSERT INTO auth_users (
                email,
                name,
                google_id,
                text_quota,
                image_quota,
                pdf_quota,
                speech_quota,
                video_quota,
                created_at,
                updated_at
              ) VALUES (
                ${user.email},
                ${user.name},
                ${account.providerAccountId},
                -1,
                10,
                8,
                5,
                2,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )
            `
          }
        }

        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session }) {
      if (session.user?.email) {
        const users = await sql`
          SELECT id
          FROM auth_users
          WHERE email = ${session.user.email}
        `
        if (users.length > 0) {
          session.user.id = users[0].id
        }
      }
      return session
    }
  }
} 