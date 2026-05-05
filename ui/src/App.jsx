import { useState } from 'react'
import './App.css'

const MESSAGE_LIMIT = 1024
const API_URL = 'http://oblivionriver.com/api/message'
const MESSAGE_URL = 'http://oblivionriver.com/message'

function generateHash(length = 16) {
  const bytes = new Uint8Array(Math.ceil(length / 2))
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

function App() {
  const [message, setMessage] = useState('')
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

    const id = crypto.randomUUID()
    const hash = generateHash()

    setIsSubmitting(true)
    setError('')
    setResultUrl('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, hash }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`)
      }

      setResultUrl(`${MESSAGE_URL}/${id}#${hash}`)
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
          Enter a message, generate a one-time message address, and return the
          link with its fragment hash.
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
              <a href={resultUrl} target="_blank" rel="noreferrer">
                {resultUrl}
              </a>
            </div>
          ) : (
            <div className="feedback-box placeholder-box">
              The generated message link will appear here.
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
