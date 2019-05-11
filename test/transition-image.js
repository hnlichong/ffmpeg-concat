const concat = require('..')
const path = require('path')

// concat 3 mp4s together using 2 500ms directionalWipe transitions
async function main() {
  await concat({
    output: path.resolve(__dirname, `./output/${Date.now()}.mp4`),
    videos: [
      path.resolve(__dirname, './input/000.jpg'),
      path.resolve(__dirname, './input/001.jpg'),
      path.resolve(__dirname, './input/002.jpg'),
      path.resolve(__dirname, './input/003.jpg'),
      path.resolve(__dirname, './input/004.jpg'),
      path.resolve(__dirname, './input/005.jpg'),
      path.resolve(__dirname, './input/006.jpg'),
      path.resolve(__dirname, './input/007.jpg'),
    ],
    transition: {
      name: 'fade',
      duration: 500
    }
  })
}

main()
