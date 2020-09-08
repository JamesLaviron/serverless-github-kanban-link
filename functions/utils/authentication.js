import * as fs from 'fs'
import jsonwebtoken from 'jsonwebtoken'
import got from 'got'

const privateKey = fs.readFileSync('./zube_api_key.pem')
const clientId = 'b96e385e-a997-11ea-bf0c-4701f8cf65fa'
const baseUrl = 'https://zube.io/api/'

async function getRefreshToken() {
  const now = Math.floor(Date.now() / 1000)
  const refreshJwt = jsonwebtoken.sign({
    iat: now, // Issued at time
    exp: now + 60, // JWT expiration time (10 minute maximum)
    iss: clientId, // Your Zube client id
  }, privateKey, { algorithm: 'RS256' })

  return refreshJwt
}

async function getAccessToken(refreshToken) {
  const result = await got.post(`${baseUrl}users/tokens`, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
      Accept: 'application/json',
      'X-Client-ID': clientId,
    },
  })

  return JSON.parse(result.body).access_token
}

export async function authenticate() {
  const refreshToken = await getRefreshToken()
  const accessToken = await getAccessToken(refreshToken)

  return accessToken
}
