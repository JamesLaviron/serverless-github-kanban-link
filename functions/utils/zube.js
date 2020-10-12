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

  console.log(accessToken)

  return accessToken
}

async function getCardByNumber(accessToken, cardNumber) {
  const result = await got(`${baseUrl}cards?where[number]=${cardNumber}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: `application/json`,
      'Content-Type': `application/json`,
      'X-Client-ID': clientId,
    },
  })

  return JSON.parse(result.body).data[0]
}

async function updateCardState(accessToken, card, categoryName) {
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
}

async function updateCardBody(accessToken, card) {
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
  const card = getCardByNumber(accessToken, cardNumber)

  // Get github event informations
  const { action = `push` } = requestBody

  // Manage pull request merge
  if (`push` === action) {
    await updateCardState(accessToken, card, deployedState)

    // Update story description to set destination preproduction environment if possible
    const { destinationBranch = null } = getDestinationbranch(requestBody)
    if (`master` === destinationBranch) {
      card.body = addDeployEnvToStory(card, `Story déployée sur la branche master`)
    } else {
      card.body = addDeployEnvToStory(card, `Story non déployée sur master -> à voir avec le développeur de la story`)
    }

    await updateCardBody(accessToken, card)

    return {
      statusCode: 200,
      body: `Successfully updated card state`,
    }
  }

  // Apply changes if needed depending on PR labels
  const { labels = null } = requestBody.pull_request
  if (`labeled` === action) {

    console.log(labels)
    for (const label in labels) {
      console.log(label)
      console.log(label.name)

      if (`Work In Progress` === label.name) {
        return updateCardState(accessToken, card, inProgress)
      }

      if (`Ready For Review` === label.name) {
        return updateCardState(accessToken, card, readyForReview)
      }
    }
    // TODO - manage where we have mutliple triggering labels on same PR

    return {
      statusCode: 400,
      body: `Didn't update story state because there were no triggering labels`,
    }
  }

  return {
    statusCode: 400,
    body: `Didn't update story state because of wrong action`,
  }
  // TODO - check that we exclude all other event actions
}
