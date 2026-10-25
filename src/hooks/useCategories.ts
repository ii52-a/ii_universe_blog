import { useCallback, useEffect, useState } from 'react'
import { categoriesApi, type Category } from '../lib/backend'

export function useCategories() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await categoriesApi.list()
      setItems(data.categories)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '分类读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    categories: items,
    names: items.map((item) => item.name),
    loading,
    error,
    refresh,
  }
}
