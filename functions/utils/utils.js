/**
 * Get zube card inside content if there is one
 *
 * @param {string} content
 *
 * @returns {string} Zube card
 */
export function getCard(content) {
  const myRegex = /(http:\/\/|https:\/\/)(zube+)\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm

  return content.match(myRegex)
}

/**
 * Get number from zube card
 *
 * @param {string} cardUrl Url of zube's card
 *
 * @returns {string} Number of the card
 */
export function getCardNumber(cardUrl) {
  return /[^/]*$/.exec(cardUrl)[0]
}

/**
 * Add deployment environment to zube card
 *
 * @param {string} cardDescription Description of zube's card
 * @param {string} deployEnvText    Sentence to describe the environment
 *
 * @returns {string}
 */
export function addDeployEnvToCard(cardDescription, deployEnvText) {
  return `${cardDescription}\r\n\r\
    ${deployEnvText}`
}
