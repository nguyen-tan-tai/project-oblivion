import { useEffect, useState } from 'react'
import encryptionService from '../services/EncryptionService'

const API_URL = '/api/message'

function normalizeHashFragment(hashFragment) {
  return hashFragment.startsWith('#') ? hashFragment.slice(1) : hashFragment
}

function DecryptPage({ messageId, hashFragment }) {
  const [secret, setSecret] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedHash = normalizeHashFragment(hashFragment)
  const requiresSecret = encryptionService.isEncryptedHash(normalizedHash)

  async function retrieveMessage(resolvedHash) {
    const response = await fetch(`${API_URL}/${messageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`)
    }

    const result = await response.json()
    if (!result.message) {
      throw new Error('API response did not include an encrypted message.')
    }

    return encryptionService.decryptMessage(result.message, resolvedHash)
  }

  async function handleDecrypt(event) {
    event?.preventDefault()

    if (!messageId) {
      setError('Message identifier is missing from the URL.')
      setMessage('')
      return
    }

    if (!normalizedHash) {
      setError('Message hash is missing from the URL fragment.')
      setMessage('')
      return
    }

    if (requiresSecret && !secret) {
      setError('Secret is required to decrypt this message link.')
      setMessage('')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const resolvedHash = requiresSecret
        ? await encryptionService.decryptHash(encryptionService.stripHashPrefix(normalizedHash), secret)
        : normalizedHash
      const decryptedMessage = await retrieveMessage(resolvedHash)
      setMessage(decryptedMessage)
    } catch (requestError) {
      setMessage('')
      setError(requestError.message || 'Unable to decrypt the message.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (requiresSecret || !messageId || !normalizedHash) {
      return
    }

    handleDecrypt()
  }, [messageId, normalizedHash, requiresSecret])

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Oblivion Project</p>
        <h1>Decrypt an oblivion message</h1>
        <p className="hero-copy">
          Open the protected message using the address fragment and optional secret.
        </p>
      </section>

      <section className="composer-panel">
        <form className="message-form" onSubmit={handleDecrypt}>
          <label className="field-label" htmlFor="message-id">
            Message ID
          </label>
          <input
            id="message-id"
            name="message-id"
            className="secret-input"
            type="text"
            value={messageId}
            readOnly
          />

          <label className="field-label" htmlFor="hash-fragment">
            Hash
          </label>
          <input
            id="hash-fragment"
            name="hash-fragment"
            className="secret-input"
            type="text"
            value={normalizedHash}
            readOnly
          />

          <label className="field-label" htmlFor="secret">
            Secret
          </label>
          <input
            id="secret"
            name="secret"
            className="secret-input"
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder={requiresSecret ? 'Required to unlock the hash' : 'Not required for this link'}
          />

          <div className="form-footer">
            <a className="char-count" href="/">
              Back to send message page
            </a>
            <button className="create-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Decrypting...' : 'Decrypt'}
            </button>
          </div>
        </form>

        {error ? (
          <div className="feedback-box error-box" role="alert">
            {error}
          </div>
        ) : null}

        <section className="result-panel" aria-live="polite">
          <h2>Message</h2>
          {message ? (
            <div className="feedback-box result-box">
              <pre>{message}</pre>
            </div>
          ) : (
            <div className="feedback-box placeholder-box">
              {requiresSecret
                ? 'Enter the secret to unlock and decrypt the message.'
                : 'The decrypted message will appear here.'}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default DecryptPage
