import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function setupScroll(
  onChapterProgress: (index: number, progress: number) => void,
  onVivid: (progress: number) => void,
): () => void {
  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Hero: typography lifts away as the journey starts.
    gsap.to('#hero-inner', {
      y: -120,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom 25%',
        scrub: true,
      },
    })
    gsap.fromTo(
      '.scroll-cue',
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '20% top',
          scrub: true,
        },
      },
    )

    // Single-element reveals.
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.fromTo(
        element,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            toggleActions: 'play none none reverse',
          },
        },
      )
    })

    // Grouped children, staggered on entry.
    gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const children = Array.from(group.children)
      gsap.fromTo(
        children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: group,
            start: 'top bottom',
            toggleActions: 'play none none reverse',
          },
        },
      )
    })

    // Overall page progress: the world gains color as you discover it.
    ScrollTrigger.create({
      trigger: '#app',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => onVivid(self.progress),
    })

    // Chapter triggers feed the 3D world its story progress,
    // and flip the page accent as each chapter arrives.
    const chapters: Array<{ selector: string; start: string; end: string }> = [
      { selector: '#about', start: 'top bottom', end: 'bottom top' },
      { selector: '#experience', start: 'top bottom', end: 'bottom top' },
      { selector: '#work', start: 'top bottom', end: 'bottom top' },
      { selector: '#contact', start: 'top bottom', end: 'bottom bottom' },
    ]
    chapters.forEach((chapter, index) => {
      ScrollTrigger.create({
        trigger: chapter.selector,
        start: chapter.start,
        end: chapter.end,
        toggleClass: { targets: 'body', className: `in-c${index + 1}` },
        onUpdate: (self) => onChapterProgress(index, self.progress),
      })
    })

    // Cards tilt toward the pointer.
    gsap.utils.toArray<HTMLElement>('.card').forEach((card) => {
      gsap.set(card, { transformPerspective: 900 })
      const rotationX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' })
      const rotationY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' })
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5
        rotationY(px * 14)
        rotationX(-py * 14)
      })
      card.addEventListener('pointerleave', () => {
        rotationX(0)
        rotationY(0)
      })
    })

    ScrollTrigger.refresh()

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  })

  return () => {
    mm.revert()
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }
}
