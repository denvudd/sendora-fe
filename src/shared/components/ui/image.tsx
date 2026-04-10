'use client'

import type { ImageProps } from 'next/image'
import type { ReactElement } from 'react'

import { uploadcareLoader } from '@uploadcare/nextjs-loader'
import ImagePrimitive from 'next/image'

export function Image({ src, alt, ...props }: ImageProps): ReactElement {
  console.log('🚀 ~ Image ~ src:', src)

  return (
    <ImagePrimitive
      alt={alt}
      loader={uploadcareLoader}
      src={src}
      unoptimized={false}
      {...props}
    />
  )
}
