import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 *
 * Generic over the record type: pass your collection's interface as
 * `useRealtime<MyRecord>(...)` to get a typed subscription payload
 * instead of `unknown`.
 *
 * The subscription is only created when the user is authenticated and
 * the PocketBase client has a valid token, and it re-subscribes
 * whenever the token changes (e.g. after an auth refresh) — this
 * prevents the "Invalid realtime client" 400 error that happens when
 * subscribing before auth is ready or with a stale/expired token.
 */
export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
) {
  const { token } = useAuth()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    // Guard: only subscribe when auth is ready and we hold a valid token.
    if (!enabled || !token || !pb.authStore.isValid || !pb.authStore.token) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    pb.collection<TRecord>(collectionName)
      .subscribe('*', (e) => {
        callbackRef.current(e)
      })
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled, token])
}

export default useRealtime
