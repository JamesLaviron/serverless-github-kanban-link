import { authenticate } from './utils/authentication'

let accessToken

/**
 * Webhook main method
 */
export async function updateKanban() {
  console.log('Update kanban!')

  accessToken = await authenticate()
  console.log(accessToken)
}
