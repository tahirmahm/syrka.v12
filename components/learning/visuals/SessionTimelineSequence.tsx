'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { Play, Pause, ArrowClockwise } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'

gsap.registerPlugin(MotionPathPlugin)

export interface SessionTimelineStage {
  id: string
  label: string
  date: string
  independenceLevel: string
  activity: string
  response: string
}

export interface SessionTimelineSequenceProps {
  chapterTitle: string
  conceptTitle: string
  stages: SessionTimelineStage[]
}

/**
 * LEARN-002 (visual-direction correction) — the primary pedagogical GSAP
 * sequence: real three-session adaptive history (diagnose -> change
 * strategy -> transfer), never fabricated. A runner travels a
 * MotionPath-driven track through each stage marker; the timeline is
 * built once per mount (useGSAP handles scoped cleanup automatically),
 * paused by default, and driven entirely by Play/Pause/Replay — no
 * autoplay loop competing with the student's attention. Reduced motion
 * renders every stage already expanded, in reading order, with no
 * animation at all.
 */
export function SessionTimelineSequence({ chapterTitle, conceptTitle, stages }: SessionTimelineSequenceProps) {
  const reduceMotion = useReducedMotionSafe()
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const runnerRef = useRef<SVGCircleElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const timelineRef = useRef<gsap.core.Timeline>()

  const trackWidth = 640
  const stageX = stages.map((_, i) => 40 + (i * (trackWidth - 80)) / Math.max(stages.length - 1, 1))

  useGSAP(
    () => {
      if (reduceMotion || !pathRef.current || !runnerRef.current) return

      const tl = gsap.timeline({ paused: true, onComplete: () => { setPlaying(false); setCompleted(true) } })
      timelineRef.current = tl

      stages.forEach((_, i) => {
        tl.addLabel(`stage-${i}`)
        if (i > 0) {
          tl.to(
            runnerRef.current,
            {
              motionPath: {
                path: pathRef.current!,
                start: (i - 1) / Math.max(stages.length - 1, 1),
                end: i / Math.max(stages.length - 1, 1),
                align: pathRef.current!,
              },
              duration: 1.1,
              ease: 'power2.inOut',
              onStart: () => setActiveIndex(i),
            },
            `>`
          )
        }
        tl.to({}, { duration: 0.9 })
      })

      return () => {
        tl.kill()
      }
    },
    { scope: containerRef, dependencies: [stages, reduceMotion] }
  )

  function handlePlay() {
    if (completed) {
      timelineRef.current?.restart()
      setCompleted(false)
      setActiveIndex(0)
    }
    timelineRef.current?.play()
    setPlaying(true)
  }
  function handlePause() {
    timelineRef.current?.pause()
    setPlaying(false)
  }
  function handleReplay() {
    timelineRef.current?.restart()
    setActiveIndex(0)
    setCompleted(false)
    setPlaying(true)
    timelineRef.current?.play()
  }

  if (reduceMotion) {
    return (
      <div className="flex flex-col gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-5">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{chapterTitle} — {conceptTitle}: session history</p>
        {stages.map((stage) => (
          <StagePanel key={stage.id} stage={stage} />
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-5">
      <div className="flex items-center justify-between">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{chapterTitle} — {conceptTitle}: session history</p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={playing ? handlePause : handlePlay} aria-label={playing ? 'Pause' : 'Play'} className="rounded-campus-sm border border-campus-border p-1.5 hover:bg-campus-surface-raised">
            {playing ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
          </button>
          <button type="button" onClick={handleReplay} aria-label="Replay" className="rounded-campus-sm border border-campus-border p-1.5 hover:bg-campus-surface-raised">
            <ArrowClockwise size={13} />
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${trackWidth} 60`} className="w-full" aria-hidden="true">
        <path ref={pathRef} d={`M ${stageX[0]} 30 ${stageX.slice(1).map((x) => `L ${x} 30`).join(' ')}`} fill="none" className="stroke-campus-border" strokeWidth={2} />
        {stageX.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={30} r={5} className={i <= activeIndex ? 'fill-campus-blue-600 dark:fill-campus-blue-dark' : 'fill-campus-stone-300 dark:fill-campus-border'} />
            <text x={x} y={50} textAnchor="middle" className="fill-campus-muted font-campus-mono text-[9px] uppercase">{stages[i].label}</text>
          </g>
        ))}
        <circle ref={runnerRef} cx={stageX[0]} cy={30} r={7} className="fill-campus-gold-500" />
      </svg>

      {playing && (
        <SyrkaIntelligenceState state="working" size="sm" label={`Replaying session ${activeIndex + 1} of ${stages.length}`} />
      )}

      <StagePanel stage={stages[activeIndex]} />
    </div>
  )
}

function StagePanel({ stage }: { stage: SessionTimelineStage }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-campus-border pt-3">
      <div className="flex items-center justify-between">
        <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{stage.label}</p>
        <span className="font-campus-mono text-[10px] text-campus-muted">{stage.date}</span>
      </div>
      <p className="font-campus-sans text-campus-xs text-campus-muted"><span className="font-medium text-campus-text">Activity: </span>{stage.activity}</p>
      <p className="font-campus-sans text-campus-xs text-campus-muted"><span className="font-medium text-campus-text">Response: </span>{stage.response}</p>
      <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">{stage.independenceLevel.replace(/_/g, ' ')}</p>
    </div>
  )
}
