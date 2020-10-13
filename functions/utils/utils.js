/**
 * Get zube story inside content if there is one
 *
 * @param {string} content
 *
 * @returns {string} Zube story
 */
export function getStory(content) {
  const myRegex = /(http:\/\/|https:\/\/)(zube+)\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm

  return content.match(myRegex)
}

/**
 * Get number from zube story
 *
 * @param {string} cardUrl Url of zube's story
 *
 * @returns {string} Number of the story
 */
export function getCardNumber(cardUrl) {
  return /[^/]*$/.exec(cardUrl)[0]
}

/**
 * Add deployment environment to zube story
 *
 * @param {string} storyDescription Description of zube's story
 * @param {string} deployEnvText    Sentence to describe the environment
 *
 * @returns {string}
 */
export function addDeployEnvToStory(storyDescription, deployEnvText) {
  return `${storyDescription}\r\n\r\
    ${deployEnvText}`
}
