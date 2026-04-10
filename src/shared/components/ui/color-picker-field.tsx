'use client'

import type { ChangeEvent, ReactElement } from 'react'

import { FieldDescription, FieldError } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { cn } from '@shared/utils/cn'
import { useState } from 'react'

import { HEX_REGEX } from '@/shared/constants/regex'

const DEFAULT_SWATCH_COLOR = '#6366f1'

interface ColorPickerFieldProps {
  error?: string
}

export function ColorPickerField({
  error,
}: ColorPickerFieldProps): ReactElement {
  const [swatchColor, setSwatchColor] = useState(DEFAULT_SWATCH_COLOR)
  const [textValue, setTextValue] = useState('')
  const [isTextValid, setIsTextValid] = useState(true)

  function handleNativeColorChange(e: ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    setSwatchColor(value)
    setTextValue(value)
    setIsTextValid(true)
  }

  function handleTextChange(e: ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    setTextValue(value)

    if (value === '') {
      setIsTextValid(true)
      setSwatchColor(DEFAULT_SWATCH_COLOR)
    } else if (HEX_REGEX.test(value)) {
      setSwatchColor(value)
      setIsTextValid(true)
    } else {
      setIsTextValid(false)
    }
  }

  const showError = !isTextValid || (isTextValid && !!error)

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2',
        showError && 'text-destructive',
      )}
    >
      <Label htmlFor="primaryColor">
        Brand color{' '}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>

      <div className="flex items-center gap-2">
        <input
          aria-label="Open color picker"
          className={cn(
            'size-9 cursor-pointer rounded-md border border-input bg-transparent p-0.5',
            'transition-colors hover:border-ring',
          )}
          style={{ colorScheme: 'normal' }}
          type="color"
          value={swatchColor}
          onChange={handleNativeColorChange}
        />

        <Input
          className="flex-1"
          id="primaryColor"
          name="primaryColor"
          placeholder={DEFAULT_SWATCH_COLOR}
          value={textValue}
          onChange={handleTextChange}
        />
      </div>

      <FieldDescription>
        Enter a hex color (e.g. DEFAULT_SWATCH_COLOR) or leave blank.
      </FieldDescription>

      {!isTextValid && (
        <FieldError>
          Please enter a valid hex color in #RRGGBB format.
        </FieldError>
      )}

      {isTextValid && error && <FieldError>{error}</FieldError>}
    </div>
  )
}
