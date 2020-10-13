export function getStory(content) {
  const myRegex = /(http:\/\/|https:\/\/)(zube+)\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm

  return content.match(myRegex)
}

export function getCardNumber(cardUrl) {
  return /[^/]*$/.exec(cardUrl)[0]
}

export function addDeployEnvToStory(storyDescription, deployEnvText) {
  console.log(`storyDescription: ${storyDescription}`)
  console.log(`deployEnvText: ${deployEnvText}`)
  console.log(`${storyDescription}\r\n\r\\/${deployEnvText}`)
  console.log(`${storyDescription}\r\n\r\${deployEnvText}`)

  return `${storyDescription}\r\n\r\${deployEnvText}`
}
