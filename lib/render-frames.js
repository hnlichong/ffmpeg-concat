'use strict'

const fs = require('fs-extra')
const leftPad = require('left-pad')
const path = require('path')
const pMap = require('p-map')

const createContext = require('./context')

module.exports = async (opts) => {
  const {
    frameFormat,
    frames,
    onProgress,
    outputDir,
    theme
  } = opts

  // create webgl context
  const ctx = await createContext({
    frameFormat,
    theme
  })

  await pMap(frames, (frame, index) => {
    return module.exports.renderFrame({
      ctx,
      frame,
      frameFormat,
      index,
      onProgress,
      outputDir,
      theme
    })
  }, {
    concurrency: 8
  })

  await ctx.flush()
  await ctx.dispose()

  const framePattern = path.join(outputDir, `%012d.${frameFormat}`)
  return framePattern
}

module.exports.renderFrame = async (opts) => {
  const {
    ctx,
    frame,
    frameFormat,
    index,
    onProgress,
    outputDir,
    theme
  } = opts

  const fileName = `${leftPad(index, 12, '0')}.${frameFormat}`
  const filePath = path.join(outputDir, fileName)

  const {
    current,
    next
  } = frame

  // 过渡部分的frames是当前场景的最后一段frames(cFrames)与下一场景的开头一段frames(nFrames)的重叠(gl-transition)
  // gl-transition一次处理一个frame
  const cFrame = index - current.frameStart
  const cFramePath = current.getFrame(cFrame)

  if (!next) {
    // next is undefined，即index还处于当前场景的非过渡部分, 输出帧就是未经处理的当前帧
    await fs.move(cFramePath, filePath, { overwrite: true })
  } else {
    ctx.setTransition(current.transition)

    const nFrame = index - next.frameStart
    const nFramePath = next.getFrame(nFrame)
    const cProgress = (cFrame - current.numFramesPreTransition) / current.numFramesTransition

    // todo: gl-transition是时间无关的？类似于tween，仅依赖from, to两个状态以及进度值progress[0,1]
    await ctx.render({
      imagePathFrom: cFramePath,
      imagePathTo: nFramePath,
      progress: cProgress,
      params: current.transition.params
    })

    // filePath: 输出帧
    // todo 看下ctx.capture捕获webgl当前帧的原理 -- canvas.toImage()
    await ctx.capture(filePath)
  }

  if (onProgress && index % 16 === 0) {
    onProgress(index / theme.numFrames)
  }
}
