const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface GoogleTokenResponse {
  access_token?: string
  expires_in?: number | string
  error?: string
  error_description?: string
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

interface GoogleIdentityApi {
  initTokenClient: (options: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: { type?: string; message?: string }) => void
  }) => GoogleTokenClient
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleIdentityApi } }
  }
}

let scriptPromise: Promise<void> | null = null
let cachedToken = ''
let tokenExpiresAt = 0

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    const script = existing || document.createElement('script')
    const finish = () => window.google?.accounts?.oauth2
      ? resolve()
      : reject(new Error('O login do Google não carregou. Confira sua conexão e tente novamente.'))

    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      script.onload = finish
      script.onerror = () => reject(new Error('Não foi possível carregar o login do Google.'))
      document.head.appendChild(script)
    } else {
      script.addEventListener('load', finish, { once: true })
      script.addEventListener('error', () => reject(new Error('Não foi possível carregar o login do Google.')), { once: true })
    }
  }).catch((error: unknown) => {
    scriptPromise = null
    throw error
  })

  return scriptPromise!
}

export async function getGoogleDriveAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error('Configure VITE_GOOGLE_CLIENT_ID antes de enviar fotos ao Google Drive.')
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken
  await loadGoogleIdentityScript()
  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) throw new Error('A autenticação do Google não está disponível.')

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Não foi possível autorizar o Google Drive.'))
          return
        }
        cachedToken = response.access_token
        tokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000
        resolve(cachedToken)
      },
      error_callback: (error) => reject(new Error(error.message || 'A janela de autorização do Google foi fechada.')),
    })
    client.requestAccessToken()
  })
}

async function driveJson<T>(url: string, token: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  })
  const responseText = await response.text()
  let result: Record<string, unknown> = {}
  try { result = responseText ? JSON.parse(responseText) as Record<string, unknown> : {} } catch { /* handled below */ }
  if (!response.ok) {
    const errorObject = result.error as { message?: string } | undefined
    throw new Error(errorObject?.message || `Google Drive respondeu com status ${response.status}.`)
  }
  return result as T
}

export async function createProductImagesFolder(token: string): Promise<string> {
  const folder = await driveJson<{ id?: string }>(`${DRIVE_API}/files?fields=id`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Atacadão Curitiba - Fotos de Produtos', mimeType: 'application/vnd.google-apps.folder' }),
  })
  if (!folder.id) throw new Error('O Google Drive não retornou o identificador da pasta de imagens.')
  return folder.id
}

export async function uploadProductImageToDrive(blob: Blob, fileName: string, folderId: string, token: string): Promise<{ fileId: string; imageUrl: string }> {
  const created = await driveJson<{ id?: string }>(`${DRIVE_API}/files?fields=id`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fileName, mimeType: blob.type || 'image/webp', parents: [folderId] }),
  })
  if (!created.id) throw new Error('O Google Drive não criou o arquivo da imagem.')

  try {
    const uploadResponse = await fetch(`${DRIVE_UPLOAD_API}/files/${created.id}?uploadType=media&fields=id`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type || 'image/webp' },
      body: blob,
    })
    if (!uploadResponse.ok) {
      const message = await uploadResponse.text()
      throw new Error(message || `Falha ao enviar a imagem (${uploadResponse.status}).`)
    }

    await driveJson(`${DRIVE_API}/files/${created.id}/permissions`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    })
  } catch (error) {
    try { await deleteProductImageFromDrive(created.id, token) } catch { /* best-effort cleanup */ }
    if (error instanceof Error && /permission|sharing|domain|organization/i.test(error.message)) {
      throw new Error(`A imagem foi enviada, mas não pôde ser compartilhada publicamente. Verifique as regras de compartilhamento do Google Workspace. ${error.message}`)
    }
    throw error
  }

  return {
    fileId: created.id,
    imageUrl: `https://drive.google.com/uc?export=view&id=${encodeURIComponent(created.id)}`,
  }
}

export async function deleteProductImageFromDrive(fileId: string, token?: string): Promise<void> {
  const accessToken = token || await getGoogleDriveAccessToken()
  const response = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  })
  if (!response.ok && response.status !== 404) {
    const message = await response.text()
    throw new Error(message || `Não foi possível remover a foto do Google Drive (${response.status}).`)
  }
}

export function extractGoogleDriveFileId(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null
  try {
    const url = new URL(imageUrl)
    if (!url.hostname.endsWith('drive.google.com')) return null
    return url.searchParams.get('id')
  } catch {
    return null
  }
}
