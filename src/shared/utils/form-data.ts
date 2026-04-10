/** Trims and turns empty strings into undefined (for optional form fields). */
export function getOptionalTrimmedString(
  formData: FormData,
  key: string,
): string | undefined {
  const v = formData.get(key)

  if (v === null || v === undefined) {
    return undefined
  }

  const s = String(v).trim()

  return s === '' ? undefined : s
}
