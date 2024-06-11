import { customAlphabet } from 'nanoid'
const nanoImageId = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)

export const generateWallpaperId = () => {
  return nanoImageId()
}
