import type { ReactNode } from 'react'

function ChatbotLayout({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>
}

export default ChatbotLayout
