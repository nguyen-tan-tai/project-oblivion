const AES_KEY_LENGTH = 256
const AES_GCM_IV_LENGTH = 12
const HASH_SALT_LENGTH = 16
const PBKDF2_ITERATIONS = 600000
const MESSAGE_KEY_BYTES = 16
const ENCRYPTED_HASH_PREFIX = 'enc.'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBase64Url(bytes) {
  let binary = ''

  bytes.forEach((value) => {
    binary += String.fromCharCode(value)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(`${normalized}${padding}`)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function combineBytes(...parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const combined = new Uint8Array(totalLength)
  let offset = 0

  parts.forEach((part) => {
    combined.set(part, offset)
    offset += part.length
  })

  return combined
}

function sliceBytes(bytes, start, end) {
  return bytes.slice(start, end)
}

async function importAesKey(material) {
  const keyBytes = await crypto.subtle.digest('SHA-256', textEncoder.encode(material))

  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function derivePasswordKey(secret, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

class EncryptionService {
  generateMessageKeyToken() {
    return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(MESSAGE_KEY_BYTES)))
  }

  formatEncryptedHash(encryptedHash) {
    return `${ENCRYPTED_HASH_PREFIX}${encryptedHash}`
  }

  isEncryptedHash(hashFragment) {
    return hashFragment.startsWith(ENCRYPTED_HASH_PREFIX)
  }

  stripHashPrefix(hashFragment) {
    return this.isEncryptedHash(hashFragment)
      ? hashFragment.slice(ENCRYPTED_HASH_PREFIX.length)
      : hashFragment
  }

  async encryptMessage(message, keyMaterial) {
    const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH))
    const key = await importAesKey(keyMaterial)
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      textEncoder.encode(message),
    )

    return bytesToBase64Url(combineBytes(iv, new Uint8Array(ciphertext)))
  }

  async decryptMessage(encryptedMessage, keyMaterial) {
    const payload = base64UrlToBytes(encryptedMessage)
    const iv = sliceBytes(payload, 0, AES_GCM_IV_LENGTH)
    const ciphertext = sliceBytes(payload, AES_GCM_IV_LENGTH)
    const key = await importAesKey(keyMaterial)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext,
    )

    return textDecoder.decode(plaintext)
  }

  async encryptHash(hash, secret) {
    const salt = crypto.getRandomValues(new Uint8Array(HASH_SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH))
    const key = await derivePasswordKey(secret, salt)
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      textEncoder.encode(hash),
    )

    return bytesToBase64Url(combineBytes(salt, iv, new Uint8Array(ciphertext)))
  }

  async decryptHash(encryptedHash, secret) {
    const payload = base64UrlToBytes(encryptedHash)
    const salt = sliceBytes(payload, 0, HASH_SALT_LENGTH)
    const iv = sliceBytes(payload, HASH_SALT_LENGTH, HASH_SALT_LENGTH + AES_GCM_IV_LENGTH)
    const ciphertext = sliceBytes(payload, HASH_SALT_LENGTH + AES_GCM_IV_LENGTH)
    const key = await derivePasswordKey(secret, salt)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext,
    )

    return textDecoder.decode(plaintext)
  }
}

export default new EncryptionService()
