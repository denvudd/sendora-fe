'use client'

import type { ReactElement } from 'react'

import { createDomainAction } from '@features/domains/actions/create-domain-action'
import { Button } from '@shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog'
import { Field, FieldError } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { ArrowUpRight, PlusCircle } from 'lucide-react'
import { useActionState, useState } from 'react'

interface AddDomainDialogProps {
  canAddDomain: boolean
  domainCount: number
  domainLimit: number | null
}

interface AddDomainState {
  errors?: { hostname?: string[] }
  message?: string
}

export function AddDomainDialog({
  canAddDomain,
  domainCount,
  domainLimit,
}: AddDomainDialogProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState<AddDomainState, FormData>(
    createDomainAction,
    {},
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            aria-label="Add domain"
            className="ml-auto flex items-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            type="button"
          />
        }
      >
        <PlusCircle className="size-3.5" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {canAddDomain ? (
          <>
            <DialogHeader>
              <DialogTitle>Add domain</DialogTitle>
              <DialogDescription>
                Enter the hostname of the website where you want to embed your
                chatbot.
                {domainLimit !== null && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {domainCount} / {domainLimit} domains used on your current
                    plan.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <form action={action} className="space-y-4">
              <Field data-invalid={!!state.errors?.hostname}>
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  name="hostname"
                  placeholder="example.com"
                  autoFocus
                  required
                />
                {state.errors?.hostname && (
                  <FieldError>{state.errors.hostname[0]}</FieldError>
                )}
              </Field>

              {state.message && <FieldError>{state.message}</FieldError>}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? 'Adding…' : 'Add domain'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Domain limit reached</DialogTitle>
              <DialogDescription>
                You&apos;ve used all{' '}
                {domainLimit !== null && (
                  <span className="font-medium text-foreground">
                    {domainLimit} domain{domainLimit === 1 ? '' : 's'}
                  </span>
                )}{' '}
                included in your current plan. Upgrade to add more domains.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Domains used</p>
                  <p className="text-2xl font-bold">
                    {domainCount}
                    {domainLimit !== null && (
                      <span className="text-base font-normal text-muted-foreground">
                        {' '}
                        / {domainLimit}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button
                render={
                  <a href="/settings/billing" onClick={() => setOpen(false)} />
                }
              >
                Upgrade plan
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
