import type { ReactElement } from 'react'

import { buttonVariants } from '@shared/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import Link from 'next/link'

const SettingsPage = (): ReactElement => (
  <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your workspace preferences and subscription.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Billing &amp; subscription
          </CardTitle>
          <CardDescription>
            View your current plan, manage billing, and upgrade or cancel your
            subscription.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <Link
            className={buttonVariants({ size: 'sm' })}
            href="/settings/billing"
          >
            Manage billing
          </Link>
        </div>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Workspace settings</CardTitle>
          <CardDescription>Coming soon.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
)

export default SettingsPage
