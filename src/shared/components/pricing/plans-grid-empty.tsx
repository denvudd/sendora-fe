import type { ReactElement } from 'react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'

export function PlansGridEmpty(): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No active plans yet</CardTitle>
        <CardDescription>
          Come back later to see available plans.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
