const META_TAG_NAME = 'sendora-verification'
const FETCH_TIMEOUT_MS = 10_000

export async function fetchDomainHtml(
  hostname: string,
): Promise<string | null> {
  const urls = [`https://${hostname}`, `http://${hostname}`]

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Sendora-Verification/1.0' },
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        continue
      }

      // Read only the first 50KB to find the <head> section
      const reader = response.body?.getReader()

      if (!reader) {
        continue
      }

      let html = ''
      let bytesRead = 0
      const MAX_BYTES = 50_000

      while (bytesRead < MAX_BYTES) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        html += new TextDecoder().decode(value)
        bytesRead += value?.length ?? 0

        // Stop once we've passed </head>
        if (html.toLowerCase().includes('</head>')) {
          break
        }
      }

      reader.cancel().catch(() => {})

      return html
    } catch {
      continue
    }
  }

  return null
}

export function checkMetaTag(html: string, token: string): boolean {
  // Match: <meta name="sendora-verification" content="TOKEN" />
  // Allow any attribute order and whitespace variations
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<meta[^>]+name=["']${META_TAG_NAME}["'][^>]+content=["']${escapedToken}["']|` +
      `<meta[^>]+content=["']${escapedToken}["'][^>]+name=["']${META_TAG_NAME}["']`,
    'i',
  )

  return pattern.test(html)
}
