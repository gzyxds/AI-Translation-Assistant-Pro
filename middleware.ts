import { withAuth } from "next-auth/middleware"

// 导出中间件函数
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    console.log('中间件运行:', req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 如果是订阅成功后的重定向，检查token或允许一次性访问
        if (req.nextUrl.pathname === '/profile' && req.nextUrl.searchParams.get('subscription') === 'success') {
          // 如果有token，允许访问
          if (token) {
            return true
          }
          // 如果没有token，重定向到登录页面
          return false
        }
        return !!token
      }
    },
  }
)

// 配置需要保护的路由
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
  ]
} 