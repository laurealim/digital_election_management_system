import { useState, useEffect } from 'react'

/**
 * Props:
 *   targetDate — JS Date or ISO string — the moment to count down to
 *   onExpire   — optional callback when countdown hits zero
 *   compact    — if true, render small inline version (default: false)
 */
export default function CountdownTimer({ targetDate, onExpire, compact = false }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate))

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.()
      return
    }

    const id = setInterval(() => {
      const r = getRemaining(targetDate)
      setRemaining(r)
      if (r <= 0) {
        clearInterval(id)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [targetDate]) // eslint-disable-line react-hooks/exhaustive-deps

  if (remaining <= 0) return <span className="text-muted-foreground text-xs">Starting…</span>

  const { days, hours, minutes, seconds } = decompose(remaining)

  if (compact) {
    return (
      <span className="font-mono text-sm tabular-nums">
        {days > 0 && <>{days}d </>}
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        ভোটগ্রহণ শুরু হতে বাকি
      </div>
      <div className="flex items-center gap-1.5">
        {days > 0 && (
          <>
            <TimeBox value={days} label="দিন" />
            <Separator />
          </>
        )}
        <TimeBox value={hours} label="ঘণ্টা" />
        <Separator />
        <TimeBox value={minutes} label="মিনিট" />
        <Separator />
        <TimeBox value={seconds} label="সেকেন্ড" />
      </div>
    </div>
  )
}

function TimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-lg sm:text-xl font-bold tabular-nums leading-none bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-1.5 min-w-[2.5rem] text-center shadow-sm">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  )
}

function Separator() {
  return <span className="text-amber-400 font-bold text-lg leading-none mb-3.5">:</span>
}

function getRemaining(targetDate) {
  return Math.max(0, new Date(targetDate).getTime() - Date.now())
}

function decompose(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}
