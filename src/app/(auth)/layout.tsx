import type { ReactElement, ReactNode } from 'react'

const AuthLayout = ({ children }: { children: ReactNode }): ReactElement => (
  <main className="flex min-h-screen items-center justify-center bg-background">
    {children}
  </main>
)

export default AuthLayout
