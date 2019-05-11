const concat = require('ffmpeg-concat')
const path = require('path')

// concat 3 mp4s together using 2 500ms directionalWipe transitions
async function main() {
  await concat({
    output: path.resolve(__dirname, `./output/${Date.now()}.mp4`),
    videos: [
      path.resolve(__dirname, './input/000.mp4'),
      path.resolve(__dirname, './input/001.mp4'),
      path.resolve(__dirname, './input/002.mp4'),
      path.resolve(__dirname, './input/003.mp4'),
      path.resolve(__dirname, './input/004.mp4'),
      path.resolve(__dirname, './input/005.mp4'),
      path.resolve(__dirname, './input/006.mp4'),
      path.resolve(__dirname, './input/007.mp4'),
    ],
    transition: {
      name: 'fade',
      duration: 500
    }
  })

}

main()
