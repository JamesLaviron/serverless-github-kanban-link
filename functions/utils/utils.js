export function getStory(content) {
  const myRegex = /(http:\/\/|https:\/\/)(zube+)\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm

  return content.match(myRegex)
}

export function getCardNumber(cardUrl) {
  return /[^/]*$/.exec(cardUrl)[0]
}

export function addDeployEnvToStory(storyDescription, deployEnv) {
  console.log(storyDescription)
  console.log(deployEnv)
  console.log(`${storyDescription}\r\n\r\/${deployEnv}`)

  return `${storyDescription}\r\n\r\/${deployEnv}`
}

export function getDestinationbranch(data) {
  return /[^/]*$/.exec(data.ref)[0]
}
