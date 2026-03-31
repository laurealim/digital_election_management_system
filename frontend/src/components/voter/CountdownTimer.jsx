import { useState, useEffect } from 'react'

/**
 * Props:
 *   targetDate — JS Date or ISO string — the moment to count down to
 *   onExpire   — optional callback when countdown hits zero
 */
export default function CountdownTimer({ targetDate, onExpire }) {
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

  return (
    <span className="font-mono text-sm tabular-nums">
      {days > 0 && <>{days}d </>}
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
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
