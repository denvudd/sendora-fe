import type { ReactNode } from 'react'

function PortalLayout({ children }: { children: ReactNode }) {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>
}

export default PortalLayout
