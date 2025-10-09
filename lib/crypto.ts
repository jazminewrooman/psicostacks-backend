import crypto from 'crypto'

function keyBuf() {
  const b64 = process.env.CREDENTIALS_ENC_KEY
  if (!b64) throw new Error('CREDENTIALS_ENC_KEY missing')
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32) throw new Error('CREDENTIALS_ENC_KEY must be 32 bytes base64')
  return key
}

export function encryptJson(obj: any) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf(), iv)
  const plaintext = Buffer.from(JSON.stringify(obj))
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: enc.toString('base64')
  }
}

export function decryptJson(payload: { iv: string, tag: string, ciphertext: string }) {
  const iv = Buffer.from(payload.iv, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')
  const data = Buffer.from(payload.ciphertext, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf(), iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(dec.toString('utf8'))
}

export function sha256Canonical(obj: any) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort()) // simple canonicalization
  return crypto.createHash('sha256').update(canonical).digest('hex')
}
