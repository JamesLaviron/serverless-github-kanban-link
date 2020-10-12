import got from 'got'
import { addDeployEnvToStory, getCardNumber, getDestinationbranch } from './utils'
import { authenticate } from './authentication'

const baseUrl = process.env.KANBAN_BASE_URL
const clientId = process.env.KANBAN_CLIENT_ID
const deployedState = process.env.DEPLOYED_STATE
const inProgress = process.env.WIP_STATE
const readyForReview = process.env.RFR_STATE

let response

async function getAccessToken() {
  // Get access token to request API
  const accessToken = await authenticate()

  return accessToken
}

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

async function updateCardState(accessToken, card, categoryName) {
  try {
    console.log(card)
    console.log(categoryName)
    console.log(accessToken)

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

async function updateCardCategory(accessToken, card, labels) {
  const promises = []
  for (const label of labels) {
    console.log(label)
    console.log(label.name)
    if (`Work+In+Progress` === label.name) {
      promises.push(updateCardState(accessToken, card, inProgress))
    }

    if (`Ready+for+Review` === label.name) {
      promises.push(updateCardState(accessToken, card, readyForReview))
    }
  }

  response = await Promise.all(promises)

  return response
}

export async function updateStory(storyUrl, requestBody) {
  console.log(`begin updateState of following story: ${storyUrl}`)

  // Retrieve card from API
  const accessToken = await getAccessToken()

  if (!accessToken) {
    response = {
      statusCode: 500,
      body: `Couldn't authenticate to kanban's API`,
    }

    return response
  }

  const cardNumber = getCardNumber(storyUrl)
  const card = await getCardByNumber(accessToken, cardNumber)

  if (!card) {
    return {
      statusCode: 500,
      body: `Issue to find card with number ${cardNumber}`,
    }
  }

  // Get github event informations
  const { action = null } = requestBody

  console.log(action)
  console.log(requestBody.pull_request.merged)


  // Manage pull request merge
  if (`closed` === action && requestBody.pull_request.merged) {
    // TODO - refacto this method so that it returns null
    await updateCardState(accessToken, card, deployedState)

    // Update story description to set destination preproduction environment if possible
    const destinationBranch = getDestinationbranch(requestBody)
    if (`master` === destinationBranch) {
      card.body = addDeployEnvToStory(card, `Story déployée sur la branche master`)
    } else {
      card.body = addDeployEnvToStory(card, `Story non déployée sur master -> à voir avec le développeur de la story`)
    }

    response = await updateCardBody(accessToken, card)

    return response
  }

  // Apply changes if needed depending on PR labels
  const { labels = null } = requestBody.pull_request

  if (`labeled` === action && labels) {
    console.log(labels)
    response = await updateCardCategory(accessToken, card, labels)

    return response
    // TODO - manage where we have mutliple triggering labels on same PR
  }

  return {
    statusCode: 400,
    body: `Didn't update story state because of wrong action`,
  }
  // TODO - check that we exclude all other event actions
}
