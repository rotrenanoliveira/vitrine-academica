export function getAssetsUrl(storageKey: string) {
  const base = process.env.NEXT_PUBLIC_ASSETS_URL?.replace(/\/$/, '')

  if (!base) {
    throw new Error('NEXT_PUBLIC_ASSETS_URL is not set.')
  }

  return `${base}/${storageKey}`
}
