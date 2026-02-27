'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons'
import type { PromptData } from '@/lib/prompt-builders'
import { cn } from '@/lib/utils'

interface PromptInspectorProps {
  isOpen: boolean
  onClose: () => void
  promptData: PromptData | null
}

export function PromptInspector({ isOpen, onClose, promptData }: PromptInspectorProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(40) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const viewportHeight = window.innerHeight
      const newHeight = ((viewportHeight - e.clientY) / viewportHeight) * 100
      setHeight(Math.min(80, Math.max(20, newHeight)))
    }

    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 z-50 flex flex-col"
      style={{ height: `${height}vh` }}
    >
      {/* Drag Handle */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 cursor-ns-resize select-none"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">≡≡≡</span>
          <span className="font-semibold text-sm">🔍 Prompt Inspector</span>
          {promptData?.step && <span className="text-xs text-slate-400">({promptData.step})</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyToClipboard(promptData?.fullPrompt || '')}
            className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
          >
            Copy All
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {!promptData ? (
          <div className="text-slate-400 text-center py-8">
            No prompt data available. Adjust settings or generate content to see prompts.
          </div>
        ) : (
          <div className="space-y-4">
            {promptData.messages?.map((msg, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <button
                  onClick={() => toggleSection(`msg-${idx}`)}
                  className="flex items-center gap-2 w-full text-left font-medium mb-2 hover:text-indigo-400 transition-colors"
                >
                  {expandedSections[`msg-${idx}`] ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                  <span className="text-indigo-400">
                    [
                    {msg.role === 'system'
                      ? 'System Prompt'
                      : msg.role === 'user'
                        ? 'User Prompt'
                        : 'Assistant'}
                    ]
                  </span>
                </button>

                {expandedSections[`msg-${idx}`] && (
                  <div className="ml-6 space-y-2">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-900 p-2 rounded font-mono">
                      {msg.content}
                    </pre>

                    {msg.variables && Object.keys(msg.variables).length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleSection(`vars-${idx}`)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                        >
                          {expandedSections[`vars-${idx}`] ? (
                            <ChevronDownIcon className="w-3 h-3" />
                          ) : (
                            <ChevronRightIcon className="w-3 h-3" />
                          )}
                          Variables
                        </button>

                        {expandedSections[`vars-${idx}`] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {Object.entries(msg.variables).map(([key, value]) => (
                              <div key={key} className="text-xs font-mono">
                                <span className="text-emerald-400">{key}:</span>{' '}
                                <span className="text-slate-300">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
