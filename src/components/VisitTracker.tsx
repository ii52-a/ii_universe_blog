/**
 * 访问统计
 * 职责：每次打开页面时上报一次访问。
 * 样式：无独立样式
 */

import { useEffect } from 'react'
import { visitsApi } from '../lib/backend'

/**
 * 每次打开页面记录一次访问；服务端按 Asia/Shanghai 日期汇总到
 * site_visits，首页底部的折线图读取同一份真实记录。
 */
export function VisitTracker() {
  useEffect(() => {
    void visitsApi
      .track()
      .then(() => window.dispatchEvent(new Event('ii:visit-recorded')))
      .catch(() => {
        // 访问统计失败不影响页面。
      })
  }, [])

  return null
}
