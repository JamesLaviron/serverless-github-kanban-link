export function getStory(content) {
  const myRegex = /(http:\/\/|https:\/\/)(zube+)\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm

  return content.match(myRegex)
}
