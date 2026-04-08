import type { Workspace } from '@prisma/client'
import type { ReactElement } from 'react'

interface DashboardPageProps {
  workspace: Workspace
}

export function DashboardPage({ workspace }: DashboardPageProps): ReactElement {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div
        className="
          mx-auto w-full max-w-6xl px-6 py-16
          lg:px-10
        "
      >
        <h1 className="text-3xl font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Welcome to your dashboard. More features coming soon.
        </p>
      </div>
    </main>
  )
}
