import got from 'got'
import { addDeployEnvToCard, getCardNumber } from './utils'
import { authenticate } from './authentication'

const baseUrl = process.env.KANBAN_BASE_URL
const clientId = process.env.KANBAN_CLIENT_ID
const deployedState = process.env.DEPLOYED_STATE
const inProgress = process.env.WIP_STATE
const readyForReview = process.env.RFR_STATE
const deployBranch = process.env.DEPLOY_BRANCH
const inProgressLabel = process.env.WIP_LABEL
const readyForReviewLabel = process.env.RFR_LABEL

let response

/**
 * Get access token to connect to zube API
 */
async function getAccessToken() {
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
async function getCardByNumber(accessToken, cardNumber) {
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
async function updateCardCategory(accessToken, card, categoryName) {
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
async function updateCardBody(accessToken, card) {
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
async function updateCardState(accessToken, card, labels) {
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
  /* eslint-disable no-await-in-loop */

  return {
    statusCode: 400,
    body: `Event is not a Pull Request or a push event`,
  }
}

export async function updateCard(cardUrl, requestBody) {
  console.log(`begin updateState of following card: ${cardUrl}`)

  // Retrieve card from API
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return {
      statusCode: 500,
      body: `Couldn't authenticate to kanban's API`,
    }
  }

  const cardNumber = getCardNumber(cardUrl)
  const card = await getCardByNumber(accessToken, cardNumber)
  if (!card) {
    return {
      statusCode: 500,
      body: `Issue to find card with number ${cardNumber}`,
    }
  }

  // Get github event informations
  const { action = null } = requestBody

  // Manage pull request merge
  if (`closed` === action && requestBody.pull_request.merged) {
    // Update card description to set destination preproduction environment if possible
    if (deployBranch === requestBody.pull_request.base.ref) {
      console.log(`card.body ${card.body}`)
      card.body = addDeployEnvToCard(card.body, `Story déployée sur la branche master`)
    } else {
      card.body = addDeployEnvToCard(card.body, `Story non déployée sur master -> à voir avec le développeur de la story`)
    }

    const promises = []
    promises.push(updateCardCategory(accessToken, card, deployedState))
    promises.push(updateCardBody(accessToken, card))

    await Promise.all(promises)
      .then(() => ({
        statusCode: 200,
        body: `Successfully updated ${card.number} following merge`,
      }))
      .catch((e) => {
        console.error(e)

        return {
          statusCode: 500,
          body: `Process finished with error: ${e.message}`,
        }
      })
  }

  // Apply changes if needed depending on PR labels
  const { labels = null } = requestBody.pull_request
  if (`labeled` === action && labels) {
    console.log(labels)
    response = await updateCardState(accessToken, card, labels)

    return response
  }

  return {
    statusCode: 400,
    body: `Didn't update card state because of wrong action`,
  }
}
