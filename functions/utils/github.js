/**
 * Validate that the given body is as the required given event in it
 *
 * @param {Object} body           JSON body from GitHub event
 * @param {array}  requiredEvents Required enabled event for the webhook
 *
 * @returns {string}
 */
export function validateWebhook(body, requiredEvents = [`pull_request`, `push`]) {
  requiredEvents.forEach((event) => {
    if (!body.hook.events.includes(event)) {
      throw new Error(`This webhook needs the "${event}" event. Please tick it.`)
    }
  })

  if ((`organization` in body)) {
    return `Hello ${body.sender.login}, the webhook is now enabled for the organization ${body.organization.login}, enjoy!`
  }

  return `Hello ${body.sender.login}, the webhook is now enabled for ${body.repository.full_name}, enjoy!`
}

/**
 * Get request body from github webhook
 *
 * @param {Object} event Github event
 *
 * @returns {string}
 */
export function getEventRequestBody(event) {
  let requestBody = event.body
  requestBody = requestBody.replace(`payload=`, ``)

  return JSON.parse(decodeURIComponent(requestBody))
}
