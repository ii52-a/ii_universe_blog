import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { tutorialUrl } from '../lib/encyclopedia'

export function GithubGuidePage() {
  const [params] = useSearchParams(), { hash } = useLocation()
  const chapter = params.get('chapter')
  return <Navigate replace to={`${tutorialUrl('github', chapter && /^[a-z][a-z0-9-]*$/.test(chapter) ? chapter : undefined)}${hash}`} />
}
