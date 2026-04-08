import type { ReactElement, ReactNode } from 'react'

const DashboardLayout = ({
  children,
}: {
  children: ReactNode
}): ReactElement => <div className="flex min-h-screen flex-col">{children}</div>

export default DashboardLayout
