
import { updateStory } from './utils/zube'
import { getStory } from './utils/utils'
import { validateWebhook, getEventRequestBody } from './utils/github'

/**
 * Webhook main method
 */
export async function updateKanban(event, context, callback) {
  console.info(`Begin execution`)

  // Configuration
  let response

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
  if (!(requestBody && ((`pull_request` in requestBody) || (`ref` in requestBody)))) {
    response = {
      statusCode: 400,
      body: `Event is not a Pull Request or a push event`,
    }

    return response
  }

  // Get PR description
  const description = requestBody.pull_request.body

  // Get zube story url linked to the PR
  const zubeStory = getStory(description)

  if (!zubeStory) {
    response = {
      statusCode: 400,
      body: `Couldn't find zube story inside PR description`,
    }

    return response
  }

  response = await updateStory(zubeStory, requestBody)

  return response
}
