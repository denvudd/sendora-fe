'use client'

import type { TProps, UploadCtxProvider } from '@uploadcare/react-uploader'
import type { ReactElement } from 'react'

import '@uploadcare/react-uploader/core.css'
import { Button } from '@shared/components/ui/button'
import { FieldError } from '@shared/components/ui/field'
import { Label } from '@shared/components/ui/label'
import { cn } from '@shared/utils/cn'
import { FileUploaderRegular } from '@uploadcare/react-uploader/next'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { env } from '@/env'

export interface UploadcareUploaderProps extends Omit<
  TProps<'Regular'>,
  'apiRef' | 'ctxName' | 'pubkey'
> {
  name: string
  value?: string
  /** Called when the stored CDN URL changes (upload, remove, or external `value` sync). */
  onCdnUrlChange?: (url: string) => void
  label?: string
  description?: string
  error?: string
  previewShape?: 'circle' | 'square'
}

const DEFAULT_MAX_LOCAL_FILE_SIZE_BYTES = 1024 * 1024 * 5 // 5MB

export const ACCEPT_PRESETS = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'ico', 'webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/ico',
      'image/webp',
    ],
  },
  video: {
    extensions: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    mimeTypes: [
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/wmv',
      'video/flv',
      'video/webm',
    ],
  },
}

function getAccept(
  acceptPreset: (typeof ACCEPT_PRESETS)[keyof typeof ACCEPT_PRESETS],
): string {
  return acceptPreset.mimeTypes.join(',')
}

export function UploadcareUploader({
  name,
  value = '',
  onCdnUrlChange,
  label,
  description,
  error,
  previewShape = 'square',
  accept = getAccept(ACCEPT_PRESETS.image),
  maxLocalFileSizeBytes = DEFAULT_MAX_LOCAL_FILE_SIZE_BYTES,
  useCloudImageEditor,
  cloudImageEditorAutoOpen,
  onFileUploadSuccess: userOnFileUploadSuccess,
  onFileUploadFailed: userOnFileUploadFailed,
  onDoneClick: userOnDoneClick,
  onCommonUploadSuccess: userOnCommonUploadSuccess,
  ...uploaderRestProps
}: UploadcareUploaderProps): ReactElement {
  const reactId = useId()

  const ctxName = `uc-${reactId.replace(/:/g, '')}`
  const apiRef = useRef<UploadCtxProvider | null>(null)

  const [cdnUrl, setCdnUrl] = useState(value)

  /**
   * When cloud image editing may run after upload, switching to preview on
   * `file-upload-success` unmounts the widget and the editor modal cannot open.
   * We keep the uploader mounted until `done-click`, then read the final CDN URL
   * from the collection API. Do not finalize on `common-upload-success` — it fires
   * right after upload while the editor may still be open.
   */
  const deferPreviewUntilFlowDone =
    useCloudImageEditor !== false || cloudImageEditorAutoOpen === true

  useEffect(() => {
    setCdnUrl(value)
  }, [value])

  useEffect(() => {
    onCdnUrlChange?.(cdnUrl)
  }, [cdnUrl, onCdnUrlChange])

  const finalizePreviewFromFlow = useCallback(
    (collectionDetail?: unknown) => {
      if (!deferPreviewUntilFlowDone) {
        return
      }

      if (collectionDetail && typeof collectionDetail === 'object') {
        const state = collectionDetail as {
          successEntries?: Array<{ cdnUrl?: string | null }>
          allEntries?: Array<{ cdnUrl?: string | null; status?: string }>
        }

        const fromSuccess = state.successEntries?.[0]?.cdnUrl

        if (fromSuccess) {
          setCdnUrl(fromSuccess)

          return
        }

        const fromAll = state.allEntries?.find(
          e => e.status === 'success',
        )?.cdnUrl

        if (fromAll) {
          setCdnUrl(fromAll)

          return
        }
      }

      const api = apiRef.current?.getAPI()

      if (!api) {
        return
      }

      const state = api.getOutputCollectionState()
      const url =
        state.successEntries?.[0]?.cdnUrl ??
        state.allEntries?.find(e => e.status === 'success')?.cdnUrl

      if (url) {
        setCdnUrl(url)
      }
    },
    [deferPreviewUntilFlowDone],
  )

  const handleRemove = useCallback(() => {
    setCdnUrl('')
    apiRef.current?.getAPI().removeAllFiles()
  }, [])

  const previewClass =
    previewShape === 'circle'
      ? 'size-16 rounded-full object-cover'
      : 'size-16 rounded-lg object-cover'

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <Label className={cn(error && 'text-destructive')}>
          {label}
          {description && (
            <span className="font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </Label>
      )}

      <input name={name} type="hidden" value={cdnUrl} />

      {cdnUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Uploaded image preview"
            className={cn('border border-border', previewClass)}
            height={64}
            src={cdnUrl}
            width={64}
          />
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      ) : (
        <FileUploaderRegular
          {...uploaderRestProps}
          accept={accept}
          apiRef={apiRef}
          classNameUploader="uploadcare-theme dark:uploadcare-theme-dark"
          cloudImageEditorAutoOpen={cloudImageEditorAutoOpen}
          ctxName={ctxName}
          maxLocalFileSizeBytes={maxLocalFileSizeBytes}
          pubkey={env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY}
          useCloudImageEditor={useCloudImageEditor}
          onCommonUploadSuccess={detail => {
            userOnCommonUploadSuccess?.(detail)
          }}
          onDoneClick={detail => {
            userOnDoneClick?.(detail)

            if (deferPreviewUntilFlowDone) {
              queueMicrotask(() => {
                finalizePreviewFromFlow()
              })
            }
          }}
          onFileUploadFailed={detail => {
            userOnFileUploadFailed?.(detail)
            console.error(detail)
          }}
          onFileUploadSuccess={detail => {
            userOnFileUploadSuccess?.(detail)

            if (!deferPreviewUntilFlowDone) {
              const url = detail.cdnUrl

              if (url) {
                setCdnUrl(url)
              }
            }
          }}
        />
      )}

      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
