import { ogSize, ogContentType, renderPlaceOGImage } from "./og-shared"

export const size = ogSize
export const contentType = ogContentType
export const alt = "Mekan detayı"

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return renderPlaceOGImage(id)
}
