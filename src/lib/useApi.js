import { useEffect, useState } from 'react'

/**
 * Run an async loader whenever `deps` change.
 * Pass `refreshMs` to poll (used for live network numbers).
 */
export function useApi(loader, deps = [], refreshMs = 0) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })

  useEffect(() => {
    let alive = true
    let timer
    const run = (initial) => {
      if (initial) setState((s) => ({ ...s, loading: true, error: null }))
      loader()
        .then((data) => alive && setState({ data, error: null, loading: false }))
        .catch((error) => alive && setState((s) => ({ data: initial ? undefined : s.data, error, loading: false })))
        .finally(() => {
          if (alive && refreshMs) timer = setTimeout(() => run(false), refreshMs)
        })
    }
    run(true)
    return () => {
      alive = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
