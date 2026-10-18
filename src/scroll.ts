import { animate, createAnimatable, createScope, onScroll, stagger } from 'animejs'

const CHAPTERS = ['#about', '#experience', '#work', '#contact']

export function setupScroll(
  onChapterProgress: (index: number, progress: number) => void,
  onVivid: (progress: number) => void,
): () => void {
  const root = document.documentElement
  const scope = createScope({
    mediaQueries: {
      reducedMotion: '(prefers-reduced-motion: reduce)',
      finePointer: '(hover: hover) and (pointer: fine)',
    },
  })
  scope.add(() => {
    if (scope.matches.reducedMotion) {
      root.style.setProperty('--vivid', '1')
      onVivid(1)
      return () => root.style.removeProperty('--vivid')
    }

    root.style.setProperty('--vivid', '0')
    onVivid(0)
    CHAPTERS.forEach((_, index) => onChapterProgress(index, 0))

    animate('#hero-inner, #hero .sfx', {
      y: [0, -100],
      opacity: [1, 0],
      ease: 'linear',
      autoplay: onScroll({
        target: '#hero',
        enter: 'top top',
        leave: '25% bottom',
        sync: true,
      }),
    })

    animate('#hero h1, #hero .tagline', {
      y: [24, 0],
      opacity: [0, 1],
      duration: 900,
      delay: stagger(140),
      ease: 'out(4)',
    })

    document
      .querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-group]')
      .forEach((element) => {
        const grouped = element.hasAttribute('data-reveal-group')
        animate(grouped ? Array.from(element.children) : element, {
          y: [36, 0],
          opacity: [0, 1],
          duration: 800,
          delay: grouped ? stagger(70) : 0,
          ease: 'out(4)',
          autoplay: onScroll({
            target: element,
            enter: 'bottom top',
            leave: 'top bottom',
            sync: 'play none play reverse',
          }),
        })
      })

    // One scroll value inks both the interface and the shader world.
    const color = { progress: 0 }
    animate(color, {
      progress: [0, 1],
      ease: 'linear',
      autoplay: onScroll({
        target: '#app',
        enter: 'top top',
        leave: 'bottom bottom',
        sync: true,
        onUpdate: (observer) => {
          root.style.setProperty('--vivid', `${observer.progress}`)
          onVivid(observer.progress)
        },
      }),
    })

    CHAPTERS.forEach((selector, index) => {
      const chapter = { progress: 0 }
      animate(chapter, {
        progress: [0, 1],
        ease: 'linear',
        autoplay: onScroll({
          target: selector,
          enter: 'bottom top',
          leave: index === CHAPTERS.length - 1 ? 'bottom bottom' : 'top bottom',
          sync: true,
          onUpdate: (observer) => onChapterProgress(index, observer.progress),
        }),
      })
    })

    const listeners = new AbortController()
    if (scope.matches.finePointer) {
      document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
        const tilt = createAnimatable(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 350,
          ease: 'out(3)',
        })
        const { rotateX, rotateY } = tilt
        if (!rotateX || !rotateY) {
          throw new Error('Anime.js card tilt properties were not initialized')
        }
        card.addEventListener(
          'pointermove',
          (event) => {
            const rect = card.getBoundingClientRect()
            rotateY(((event.clientX - rect.left - rect.width / 2) / rect.width) * 10)
            rotateX((-(event.clientY - rect.top - rect.height / 2) / rect.height) * 10)
          },
          { signal: listeners.signal },
        )
        card.addEventListener(
          'pointerleave',
          () => {
            rotateX(0)
            rotateY(0)
          },
          { signal: listeners.signal },
        )
      })
    }

    return () => {
      listeners.abort()
      root.style.removeProperty('--vivid')
    }
  })

  return () => scope.revert()
}
