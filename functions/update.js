import { authenticate } from './utils/authentication'
import { updateState } from './utils/zube'
import { getStory } from './utils/utils'
import { validateWebhook } from './utils/github'

/**
 * Webhook main method
 */
export async function updateKanban(event, context, callback) {
  console.info(`Begin execution`)

  // Configuration
  let response
  const triggeringLabels = [`bug`, `documentation`]

  // Get body from request
  let requestBody = event.body
  requestBody = requestBody.replace(`payload=`, ``)
  requestBody = JSON.parse(decodeURIComponent(requestBody))

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

    return callback(null, response)
  }

  const { labels } = requestBody.pull_request
  const { action } = requestBody.action

  // Get access token to request API
  const accessToken = await authenticate()

  if (!accessToken) {
    response = {
      statusCode: 500,
      body: `Couldn't authenticate to kanban's API`,
    }

    return callback(null, response)
  }

  console.log(accessToken)

  // Get PR description
  const description = requestBody.pull_request.body

  // Get zube story url linked to the PR
  const zubeStory = getStory(description)

  if (!zubeStory) {
    response = {
      statusCode: 500,
      body: `Couldn't find zube story inside PR description`,
    }

    return callback(null, response)
  }

  labels.forEach((element) => {
    if (triggeringLabels.includes(element.name)) {
      console.log(`Ouch, we got some things to do boys`)
    }

    if (`documentation` === element.name) {
      updateState(zubeStory, action, ``)
    }
  })

  return callback(null, {
    statusCode: 200,
    body: `Successfully authenticate to kanban's API: ${accessToken}`,
  })
}
