import './styles.css'
import { createScene } from './scene'
import { setupScroll } from './scroll'

const stage = document.querySelector<HTMLElement>('#stage')
if (!stage) {
  throw new Error('Scene container #stage not found')
}

const handle = createScene(stage)
const teardownScroll = setupScroll(
  (index, progress) => handle.setChapterProgress(index, progress),
  (progress) => handle.setVivid(progress),
)

window.addEventListener(
  'pagehide',
  () => {
    teardownScroll()
    handle.dispose()
  },
  { once: true },
)
