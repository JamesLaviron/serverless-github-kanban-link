import {
  getAccessToken, getCardByNumber, updateCardCategory, updateCardBody, updateCardState, getWorkSpaceMetadata, getCardPosition, 
} from './utils/zube'
import { addDeployEnvToCard, getCardNumber, getCardUrl } from './utils/utils'
import { validateWebhook, getEventRequestBody } from './utils/github'

let response
const deployedState = process.env.DEPLOYED_STATE
const deployBranch = process.env.DEPLOY_BRANCH

/**
 * Webhook main method
 */
export async function updateKanban(event) {
  console.info(`Begin execution`)

  // Get body from request
  const requestBody = getEventRequestBody(event)
  console.log(requestBody)

  // when creating the webhook
  if (requestBody && (`hook` in requestBody)) {
    try {
      const message = validateWebhook(requestBody)

      console.log(message)

      response = {
        statusCode: 200,
        body: message,
      }
    } catch (e) {
      console.log(e.message)

      response = {
        statusCode: 500,
        body: e.message,
      }
    }

    return response
  }

  // Check if event type is supported
  if (!(requestBody && ((`pull_request` in requestBody)))) {
    return {
      statusCode: 400,
      body: `Event is not a Pull Request or a push event`,
    }
  }

  // Get PR description
  const description = requestBody.pull_request.body

  // Get zube card url linked to the PR
  const zubeCardUrl = getCardUrl(description)

  if (!zubeCardUrl) {
    return {
      statusCode: 400,
      body: `Couldn't find zube story inside PR description`,
    }
  }

  console.log(`begin updateState of following card: ${zubeCardUrl}`)

  // Retrieve card from API
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return {
      statusCode: 500,
      body: `Couldn't authenticate to kanban's API`,
    }
  }

  const cardNumber = getCardNumber(zubeCardUrl)
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
    const promises = []
    console.log(`card.body ${card.body}`)
    // Update card description to set destination preproduction environment if possible
    if (deployBranch === requestBody.pull_request.base.ref) {
      card.body = addDeployEnvToCard(card.body, `Story déployée sur la branche master`)  
      promises.push(updateCardCategory(accessToken, card, deployedState))
    } else {
      card.body = addDeployEnvToCard(card.body, `Story non déployée sur master -> à voir avec le développeur de la story`)

      // Get pivot card current position
      const workSpaceMetaData = await getWorkSpaceMetadata(card.workspace_id)

      const workSpaceZubeId = null
      workSpaceMetaData.forEach(element => {
        if (card.workspace_id === element.workspace_id) {
          workSpaceZubeId = element.workspace_id
        }
      })
      
      const pivotCardPosition = null
      if (workSpaceZubeId) {
        pivotCardPosition = await getCardPosition(accessToken, card.workspace_id, workSpaceZubeId)
      }

      if (pivotCardPosition) {
        promises.push(updateCardCategory(accessToken, card, deployedState, pivotCardPosition))
      } else {
        promises.push(updateCardCategory(accessToken, card, deployedState))
      }
    }

  }

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
