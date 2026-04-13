'use client'

import type { Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { verifyDomainAction } from '@features/domains/actions/verify-domain-action'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { FieldError } from '@shared/components/ui/field'
import { format } from 'date-fns'
import { CheckCircle, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react'
import { useActionState, useCallback, useState } from 'react'

const META_TAG_NAME = 'sendora-verification'

interface DomainVerificationCardProps {
  domain: Domain
}

interface VerifyState {
  message?: string
  success?: boolean
}

export function DomainVerificationCard({
  domain,
}: DomainVerificationCardProps): ReactElement {
  const boundAction = useCallback(
    (prevState: VerifyState, formData: FormData) =>
      verifyDomainAction(domain.id, prevState, formData),
    [domain.id],
  )

  const [state, action, isPending] = useActionState<VerifyState, FormData>(
    boundAction,
    {},
  )
  const [copied, setCopied] = useState(false)

  const isVerified = domain.isVerified || state.success === true

  const metaTag = domain.verificationToken
    ? `<meta name="${META_TAG_NAME}" content="${domain.verificationToken}" />`
    : null

  async function handleCopy(): Promise<void> {
    if (!metaTag) {
      return
    }

    await navigator.clipboard.writeText(metaTag)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Domain verification</CardTitle>
          {isVerified ? (
            <Badge className="gap-1.5" variant="default">
              <CheckCircle className="size-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary">Unverified</Badge>
          )}
        </div>
        <CardDescription>
          Prove ownership of{' '}
          <span className="font-medium text-foreground">{domain.hostname}</span>{' '}
          by adding a meta tag to your website.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isVerified ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <ShieldCheck className="size-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Domain verified
              </p>
              {domain.verifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Verified on{' '}
                  {format(domain.verifiedAt, 'MMMM d, yyyy hh:mm a')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Step 1.</span> Add
                this tag inside the{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {'<head>'}
                </code>{' '}
                of your homepage:
              </p>

              {metaTag ? (
                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 pr-10 text-sm text-muted-foreground select-all">
                    <code>{metaTag}</code>
                  </pre>
                  <button
                    aria-label={copied ? 'Copied' : 'Copy meta tag'}
                    className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                    type="button"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No verification token generated.
                </p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Step 2.</span> Once
              the tag is live on your site, click the button below to verify.
            </p>

            {state.message && <FieldError>{state.message}</FieldError>}

            <form action={action}>
              <Button
                className="gap-2"
                disabled={isPending}
                type="submit"
                variant="outline"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Verify domain
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
