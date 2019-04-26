'use strict'

const ffmpeg = require('fluent-ffmpeg')
const isImage = true

module.exports = (opts) => {
  const {
    videoPath,
    framePattern
  } = opts

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
    // todo: inputOptions, img
      .inputOptions(isImage? [
        '-loop', '1',
        '-framerate', '25',
        '-t', '2'
      ]:[])
      .outputOptions([
        '-pix_fmt', 'rgba',
        '-start_number', '0'
      ])
      .output(framePattern)
      .on('start', (cmd) => console.log({ cmd }))
      .on('end', () => resolve(framePattern))
      .on('error', (err) => reject(err))
      .run()
  })
}
