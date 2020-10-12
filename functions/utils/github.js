/**
 * Validate that the given body is as the required given event in it
 *
 * @param object body          JSON body from GitHub event
 * @param string requiredEvent Required enabled event for the webhook
 *
 * @return string
 */
export function validateWebhook(body, requiredEvent = `pull_request`) {
  if (!body.hook.events.includes(requiredEvent)) {
    throw new Error(`This webhook needs the "${requiredEvent}" event. Please tick it.`)
  }

  if ((`organization` in body)) {
    return `Hello ${body.sender.login}, the webhook is now enabled for the organization ${body.organization.login}, enjoy!`
  }

  return `Hello ${body.sender.login}, the webhook is now enabled for ${body.repository.full_name}, enjoy!`
}

export function getEventRequestBody(event) {
  let requestBody = event.body
  requestBody = requestBody.replace(`payload=`, ``)

  return JSON.parse(decodeURIComponent(requestBody))
}
