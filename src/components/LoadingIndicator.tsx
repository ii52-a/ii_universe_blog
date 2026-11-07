export function LoadingIndicator({ label = '加载中', fullPage = false }: { label?: string; fullPage?: boolean }) {
  return <div className={`app-loading${fullPage ? ' app-loading--page' : ''}`} role="status">
    <span className="app-loading__mark" aria-hidden="true"><i /><i /><b /></span><span>{label}</span>
  </div>
}
