import got from 'got'
import { authenticate } from './authentication'

const baseUrl = process.env.KANBAN_BASE_URL
const clientId = process.env.KANBAN_CLIENT_ID
const inProgress = process.env.WIP_STATE
const readyForReview = process.env.RFR_STATE
const inProgressLabel = process.env.WIP_LABEL
const readyForReviewLabel = process.env.RFR_LABEL

let response

/**
 * Get access token to connect to zube API
 */
export async function getAccessToken() {
  // Get access token to request API
  const accessToken = await authenticate()

  return accessToken
}

/**
 * Get card using its number
 *
 * @param {string} accessToken
 * @param {int} cardNumber
 *
 * @returns {Object}
 */
export async function getCardByNumber(accessToken, cardNumber) {
  try {
    const result = await got(`${baseUrl}cards?where[number]=${cardNumber}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: `application/json`,
        'Content-Type': `application/json`,
        'X-Client-ID': clientId,
      },
    })

    return JSON.parse(result.body).data[0]
  } catch (e) {
    console.error(e)

    return null
  }
}

/**
 * Update category of zube's card
 *
 * @param {string} accessToken
 * @param {Object} card
 * @param {string} categoryName
 *
 * @return {Object}
 */
export async function updateCardCategory(accessToken, card, categoryName) {
  try {
    await got.put(`${baseUrl}cards/${card.id}/move`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `application/json`,
        'X-Client-ID': clientId,
      },
      body: JSON.stringify({
        destination: {
          position: 1,
          type: `category`,
          name: categoryName,
          workspace_id: card.workspace_id,
        },
      }),
    })

    return {
      statusCode: 200,
      body: `Put card number ${card.number} inside category ${categoryName}`,
    }
  } catch (e) {
    console.error(e)

    return {
      statusCode: 500,
      body: `Process finished with error: ${e.message}`,
    }
  }
}

/**
 * Update card description
 *
 * @param {string} accessToken
 * @param {Object} card
 *
 * @returns {Object}
 */
export async function updateCardBody(accessToken, card) {
  try {
    await got.put(`${baseUrl}cards/${card.id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `application/json`,
        'X-Client-ID': clientId,
      },
      body: JSON.stringify({
        body: card.body,
      }),
    })

    return {
      statusCode: 200,
      body: `Update body of card number ${card.number}`,
    }
  } catch (e) {
    console.error(e)

    return {
      statusCode: 500,
      body: `Process finished with error: ${e.message}`,
    }
  }
}

/**
 * Update card category if it contains triggering labels - WIP state has higher priority than RFR
 *
 * @param {string} accessToken
 * @param {Object} card
 * @param {array}  labels
 *
 * @returns {Object}
 */
export async function updateCardState(accessToken, card, labels) {
  /* eslint-disable no-await-in-loop, no-unused-vars */
  for (const label of labels) {
    console.log(label)
    switch (label.name) {
      case inProgressLabel:
        response = await updateCardCategory(accessToken, card, inProgress)

        return response
      case readyForReviewLabel:
        response = await updateCardCategory(accessToken, card, readyForReview)

        return response
      default:
    }
  }
  /* eslint-disable no-await-in-loop, no-unused-vars */

  return {
    statusCode: 400,
    body: `Event is not a Pull Request or a push event`,
  }
}
