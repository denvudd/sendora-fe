'use client'

import type { ReactElement } from 'react'

import { deleteDomainAction } from '@features/domains/actions/delete-domain-action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/components/ui/alert-dialog'
import { Button } from '@shared/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

interface DeleteDomainButtonProps {
  domainId: string
  hostname: string
}

export function DeleteDomainButton({
  domainId,
  hostname,
}: DeleteDomainButtonProps): ReactElement {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteDomainAction(domainId)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button disabled={isPending} size="sm" variant="destructive">
            <Trash2 className="size-4" />
            {isPending ? 'Deleting…' : 'Delete domain'}
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete domain</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">{hostname}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
