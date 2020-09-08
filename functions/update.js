import { authenticate } from './utils/authentication'

let accessToken

/**
 * Webhook main method
 */
export async function updateKanban(event, context, callback) {
  try {
    accessToken = await authenticate()

    return callback(null, accessToken)
  } catch (error) {
    return callback(`Problem while connecting to kanban API: ${error.message}`)
  }
}
