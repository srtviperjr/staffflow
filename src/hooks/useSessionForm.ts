import { useCallback, useEffect, useState } from 'react'
import { getSessionItem, removeSessionItem, setSessionItem } from '../storage/sessionStorage'

export function useSessionForm<T>(storageKey: string, initialValue: T) {
  const [form, setForm] = useState<T>(() => getSessionItem(storageKey, initialValue))

  useEffect(() => {
    setSessionItem(storageKey, form)
  }, [storageKey, form])

  const resetForm = useCallback(() => {
    setForm(initialValue)
    removeSessionItem(storageKey)
  }, [initialValue, storageKey])

  return { form, setForm, resetForm }
}

export function useSessionValue<T>(storageKey: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => getSessionItem(storageKey, initialValue))

  useEffect(() => {
    setSessionItem(storageKey, value)
  }, [storageKey, value])

  return [value, setValue] as const
}
