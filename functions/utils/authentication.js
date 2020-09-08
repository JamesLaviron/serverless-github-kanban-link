const fs = require('fs')
const jsonwebtoken = require('jsonwebtoken')
const got = require("got")

const private_key = fs.readFileSync(`/home/victor/Documents/projects/zube/zube_api_key.pem`)

export async function authenticate() {
    const refreshToken = await getRefreshToken()
    accessToken = await getAccessToken(refreshToken)

    return accessToken
}

async function getRefreshToken() {
    const now = Math.floor(Date.now() / 1000);
    const refresh_jwt = jsonwebtoken.sign({
        iat: now,      // Issued at time
        exp: now + 60, // JWT expiration time (10 minute maximum)
        iss: clientId // Your Zube client id
    }, private_key, { algorithm: 'RS256' });

    return refresh_jwt
}

async function getAccessToken(refreshToken) {
    const result = await got.post(`${baseUrl}users/tokens`, {
        headers: {
            'Authorization': `Bearer ${refreshToken}`,
            'Accept': `application/json`,
            'X-Client-ID': clientId
        }
    })

    return JSON.parse(result.body).access_token
}