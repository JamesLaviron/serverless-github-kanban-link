import { authenticate } from './utils/authentication'

/**
 * Webhook main method
 */
export async function updateKanban() {
    console.log(`Update kanban!`)

    var accessToken = await authenticate()
    console.log(accessToken)
}
