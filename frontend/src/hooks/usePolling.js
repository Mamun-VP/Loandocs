import { useEffect, useRef } from 'react'
export function usePolling(fn, interval = 3000, active = true) {
  const saved = useRef(fn)
  useEffect(() => { saved.current = fn }, [fn])
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => saved.current(), interval)
    return () => clearInterval(id)
  }, [interval, active])
}
