import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create your account',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 