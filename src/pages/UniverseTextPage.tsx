/**
 * Universe Text
 * 职责：universe/test 深空背景页面。
 * 样式：src/css/pages/universe-text.css
 */

import { usePageTitle } from '../hooks/usePageTitle'
import { UniverseTop } from '../components/UniverseTop'
import { UniverseDeepField } from '../components/UniverseDeepField'

export function UniverseTextPage() {
  usePageTitle('text', 'ii universe')

  return (
    <div className="universe-text-page">
      <UniverseDeepField />
      <UniverseTop />
    </div>
  )
}
