'use strict'

const ffmpegProbe = require('ffmpeg-probe')
const fs = require('fs-extra')
const leftPad = require('left-pad')
const path = require('path')
const pMap = require('p-map')

const extractVideoFrames = require('./extract-video-frames')

module.exports = async (opts) => {
  const {
    concurrency,
    log,
    videos,
    transition,
    transitions,
    frameFormat,
    outputDir
  } = opts

  if (transitions && videos.length - 1 !== transitions.length) {
    throw new Error('number of transitions must equal number of videos minus one')
  }

  // theme: 主题/电影作品 > scenes: 镜头/场景 > frames: 桢
  const scenes = await pMap(videos, (video, index) => {
    return module.exports.initScene({
      log,
      index,
      videos,
      transition,
      transitions,
      frameFormat,
      outputDir
    })
  }, {
    concurrency
  })

  // first video dictates dimensions and fps
  const {
    width,
    height,
    fps
  } = scenes[0]

  const frames = []
  let numFrames = 0

  scenes.forEach((scene, index) => {
    // 该场景从电影的第几帧开始的
    scene.frameStart = numFrames

    // 实现过渡效果前的原始帧数 scene.numFrames
    // 实现过渡效果后
    // 过渡部分的帧数 12
    scene.numFramesTransition = Math.floor(scene.transition.duration * fps / 1000)
    // 非过渡部分的帧数 50-12=38
    scene.numFramesPreTransition = Math.max(0, scene.numFrames - scene.numFramesTransition)

    numFrames += scene.numFramesPreTransition

    for (let frame = 0; frame < scene.numFrames; ++frame) {
      const cFrame = scene.frameStart + frame

      if (!frames[cFrame]) {
        const next = (frame < scene.numFramesPreTransition ? undefined : scenes[index + 1])
        // 非过渡部分的next为undefined，不会被gl-transition处理
        frames[cFrame] = {
          current: scene,
          next
        }
      }
    }
  })

  const duration = scenes.reduce((sum, scene, index) => (
    scene.duration + sum - scene.transition.duration
  ), 0)

  return {
    frames,
    scenes,
    theme: {
      numFrames,
      duration,
      width,
      height,
      fps
    }
  }
}

module.exports.initScene = async (opts) => {
  const {
    log,
    index,
    videos,
    transition,
    transitions,
    frameFormat,
    outputDir
  } = opts

  const video = videos[index]
  const probe = await ffmpegProbe(video)

  const scene = {
    video,
    index,
    width: probe.width,
    height: probe.height,
    duration: Math.max(probe.duration, 2000),  // 一个场景的时长
    numFrames: parseInt(probe.streams[0].nb_frames || 50) // todo 一个场景的总帧数
  }
  // todo: duration
  // todo: if scene duration < transition duration

  scene.fps = probe.fps || 25 // 一个场景的帧率

  const t = (transitions ? transitions[index] : transition)
  scene.transition = {
    name: 'fade',
    duration: 500,
    params: { },
    ...t
  }

  if (index >= videos.length - 1) {
    scene.transition.duration = 0
  }

  // todo scene-?
  // const fileNamePattern = `scene-${index}-%012d.${frameFormat}`
  const fileNamePattern = `scene-${index}-%012d.${frameFormat}`
  const framePattern = path.join(outputDir, fileNamePattern)
  await extractVideoFrames({
    log,
    videoPath: scene.video,
    framePattern
  })

  scene.getFrame = (frame) => {
    return framePattern.replace('%012d', leftPad(frame, 12, '0'))
  }

  // guard to ensure we only use frames that exist
  while (scene.numFrames > 0) {
    const frame = scene.getFrame(scene.numFrames - 1)
    const exists = await fs.pathExists(frame)

    if (exists) {
      break
    } else {
      scene.numFrames--
    }
  }

  return scene
}
