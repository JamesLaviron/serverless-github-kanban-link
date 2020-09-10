import { authenticate } from './utils/authentication'

let accessToken

/**
 * Webhook main method
 */
export async function updateKanban(event, context, callback) {
  try {
    accessToken = await authenticate()

    return callback(null, {
      statusCode: 200,
      body: message,
    })
  } catch (error) {
    return callback(null, {
      statusCode: 500,
      body: `Problem while connecting to kanban API: ${error.message}`,
    })
  }
}
