import { authenticate } from './utils/authentication'

let accessToken

/**
 * Webhook main method
 */
export async function updateKanban(event, context, callback) {
  try {
    console.warn('Begin execution')

    accessToken = await authenticate()

    console.warn('First callback')
    return callback(null, {
      statusCode: 200,
      body: `Successfully authenticate to kanban's API: ${accessToken}`,
    })
  } catch (error) {
    console.warn('Second callback')
    return callback(null, {
      statusCode: 500,
      body: `Problem while connecting to kanban API: ${error.message}`,
    })
  }
}
