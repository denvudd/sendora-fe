import type { ReactElement } from 'react'

import { CurrentPlanCard } from '@features/billing/components/current-plan-card'
import { ManageBillingButton } from '@features/billing/components/manage-billing-button'
import { PlanUpgradeCard } from '@features/billing/components/plan-upgrade-card'
import { findActiveSubscriptionByWorkspaceId } from '@features/commercial/repositories'
import { listActivePlans } from '@features/home/repositories/plan-repository'

interface BillingPageProps {
  workspaceId: string
}

export async function BillingPage({
  workspaceId,
}: BillingPageProps): Promise<ReactElement> {
  const [subscription, plans] = await Promise.all([
    findActiveSubscriptionByWorkspaceId({ workspaceId }),
    listActivePlans(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing &amp; subscription</h2>
        <p className="text-sm text-muted-foreground">
          Manage your plan and payment details.
        </p>
      </div>

      <CurrentPlanCard subscription={subscription} />

      <PlanUpgradeCard currentSubscription={subscription} plans={plans} />

      {subscription?.stripeSubscriptionId && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Payment method</p>
              <p className="text-xs text-muted-foreground">
                Update your card or view invoices in the Stripe billing portal.
              </p>
            </div>
            <ManageBillingButton />
          </div>
        </div>
      )}
    </div>
  )
}
