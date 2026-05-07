import { useState } from 'react'
import encryptionService from '../services/EncryptionService'

const MESSAGE_LIMIT = 1024
const API_URL = '/api/message'
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

function formatDateTimeLocal(timestamp) {
  if (!timestamp) {
    return ''
  }

  const date = new Date(timestamp)
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function CreateMessagePage() {
  const [message, setMessage] = useState('')
  const [secret, setSecret] = useState('')
  const [expireTime, setExpireTime] = useState(() => Date.now() + DEFAULT_TTL_MS)
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const remainingChars = MESSAGE_LIMIT - message.length

  async function handleSubmit(event) {
    event.preventDefault()

    if (!message.trim()) {
      setError('Message is required.')
      setResultUrl('')
      return
    }

    if (message.length > MESSAGE_LIMIT) {
      setError(`Message must be ${MESSAGE_LIMIT} characters or fewer.`)
      setResultUrl('')
      return
    }

    setIsSubmitting(true)
    setError('')
    setResultUrl('')

    try {
      const hash = encryptionService.generateMessageKeyToken()
      const encryptedMessage = await encryptionService.encryptMessage(message, hash)
      const payload = {
        message: encryptedMessage,
        expireTime,
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`)
      }

      const result = await response.json()
      const { message_id: messageId } = result
      const encryptionHash = secret
        ? encryptionService.formatEncryptedHash(await encryptionService.encryptHash(hash, secret))
        : hash

      if (!messageId) {
        throw new Error('API response did not include a message identifier.')
      }

      setResultUrl(`${window.location.origin}/message/${messageId}#${encryptionHash}`)
    } catch (requestError) {
      setError(requestError.message || 'Unable to create the message.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Oblivion Project</p>
        <h1>Create an oblivion message</h1>
        <p className="hero-copy">
          Enter a message and generate a one-time message address.
        </p>
      </section>

      <section className="composer-panel">
        <form className="message-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            className="message-input"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={MESSAGE_LIMIT}
            placeholder="Write the message to protect..."
            required
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
            placeholder="Optional password"
          />

          <label className="field-label" htmlFor="ttl">
            TTL
          </label>
          <input
            id="ttl"
            name="ttl"
            className="secret-input"
            type="datetime-local"
            value={formatDateTimeLocal(expireTime)}
            onChange={(event) => {
              const { value } = event.target

              if (!value) {
                setExpireTime(null)
                return
              }

              const expireTtl = new Date(value).getTime()
              setExpireTime(Number.isNaN(expireTtl) ? null : expireTtl)
            }}
          />

          <div className="form-footer">
            <span className="char-count">{remainingChars} characters left</span>
            <button className="create-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>

        {error ? (
          <div className="feedback-box error-box" role="alert">
            {error}
          </div>
        ) : null}

        <section className="result-panel" aria-live="polite">
          <h2>Result</h2>
          {resultUrl ? (
            <div className="feedback-box result-box">
              <a href={resultUrl}>{resultUrl}</a>
            </div>
          ) : (
            <div className="feedback-box placeholder-box">
              The API response will appear here.
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default CreateMessagePage
