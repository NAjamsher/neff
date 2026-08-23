import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const QUICK_QUESTIONS = [
  'What should I eat after workout?',
  'Why is my bench press not improving?',
  'How much protein do I need daily?',
  'I only have 20 minutes today.',
]

export default function CoachPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hey ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your NEFF AI Coach. Ask me anything about your fitness journey.`
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsLoading(true)
    try {
      const res = await api.post('/ai/coach', { message: userMsg })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">AI Coach</h1>
        <p className="text-neff-muted text-sm">Personalized guidance based on your data</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_QUESTIONS.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-neff-border text-neff-muted hover:border-neff-green hover:text-neff-green transition-colors">
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 neff-card">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === 'assistant' ? 'bg-neff-green' : 'bg-neff-border'}`}>
              {msg.role === 'assistant'
                ? <Bot size={16} className="text-black" />
                : <User size={16} className="text-white" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed
              ${msg.role === 'assistant' ? 'bg-neff-border text-white' : 'bg-neff-green text-black font-medium'}`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="text-neff-green font-semibold">{children}</strong>,
                    ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                    li: ({children}) => <li className="text-white">{children}</li>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neff-green flex items-center justify-center">
              <Bot size={16} className="text-black" />
            </div>
            <div className="bg-neff-border px-4 py-3 rounded-xl">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-neff-muted rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <input className="neff-input flex-1" placeholder="Ask your coach anything..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={isLoading} />
        <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
          className="neff-btn px-4 disabled:opacity-50">
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}