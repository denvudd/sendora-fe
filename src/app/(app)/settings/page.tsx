import type { ReactElement } from 'react'

import { buttonVariants } from '@shared/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import Link from 'next/link'

import { ROUTES } from '@/shared/constants/routes'

const SettingsPage = (): ReactElement => (
  <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your workspace preferences and subscription.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="justify-between">
        <CardHeader>
          <CardTitle className="text-base">Workspace settings</CardTitle>
          <CardDescription>
            Update your workspace name, slug, and logo.
          </CardDescription>
        </CardHeader>
        <div className="px-4 pt-4">
          <Link
            className={buttonVariants({ size: 'sm' })}
            href={ROUTES.WorkspaceSettings}
          >
            Edit workspace
          </Link>
        </div>
      </Card>

      <Card className="justify-between">
        <CardHeader>
          <CardTitle className="text-base">
            Billing &amp; subscription
          </CardTitle>
          <CardDescription>
            View your current plan, manage billing, and upgrade or cancel your
            subscription.
          </CardDescription>
        </CardHeader>
        <div className="px-4 pt-4">
          <Link
            className={buttonVariants({ size: 'sm' })}
            href={ROUTES.Billing}
          >
            Manage billing
          </Link>
        </div>
      </Card>
    </div>
  </div>
)

export default SettingsPage
