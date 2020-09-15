import jsonwebtoken from 'jsonwebtoken'
import got from 'got'

const clientId = process.env.CLIENT_ID

async function getRefreshToken() {
  const privateKey = process.env.API_KEY.replace(/\\n/gm, `\n`)
  const now = Math.floor(Date.now() / 1000)
  const refreshJwt = jsonwebtoken.sign({
    iat: now, // Issued at time
    exp: now + 60, // JWT expiration time (10 minute maximum)
    iss: clientId, // Your Zube client id
  }, privateKey, { algorithm: `RS256` })

  return refreshJwt
}

async function getAccessToken(refreshToken) {
  const baseUrl = process.env.BASE_URL
  const result = await got.post(`${baseUrl}users/tokens`, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
      Accept: `application/json`,
      'X-Client-ID': clientId,
    },
  })

  return result
}

export async function authenticate() {
  const refreshToken = await getRefreshToken()
  const accessToken = await getAccessToken(refreshToken)

  return accessToken
}
