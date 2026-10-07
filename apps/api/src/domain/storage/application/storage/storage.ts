export interface CreateSignedUrlParams {
  key: string
  mimeType: string
  size: number
}

export interface CreateSignedUrlResponse {
  url: string
  expiresIn: number
}

export interface Storage {
  createSignedUrl(params: CreateSignedUrlParams): Promise<CreateSignedUrlResponse>

  delete(key: string): Promise<void>
}
