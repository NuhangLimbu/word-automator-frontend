import React, { useState, useEffect } from 'react'
import 'boxicons/css/boxicons.min.css'

// Backend URL - will be replaced by environment variable in production
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://word-automator-backend.onrender.com'

function App() {
  const [status, setStatus] = useState('🚀 Initializing Word Automator AI...')
  const [activeTab, setActiveTab] = useState('home')
  const [selectedText, setSelectedText] = useState('')
  const [isWordConnected, setIsWordConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [correctionStyle, setCorrectionStyle] = useState('formal')
  const [selectedTemplate, setSelectedTemplate] = useState('business_report')
  const [logs, setLogs] = useState([])
  const [backendHealth, setBackendHealth] = useState(null)

  // Sample document content
  const documentContent = [
    "# Welcome to Word Automator AI",
    "",
    "This is a demonstration document showing AI-powered automation features.",
    "",
    "## Features Available:",
    "• Auto-Correction: Fix grammar and improve writing style",
    "• Template Generation: Create structured documents instantly",
    "• Text Summarization: Extract key points from long text",
    "• Style Analysis: Get insights about your writing",
    "",
    "## How to Use:",
    "1. Select any text in this document",
    "2. Click an AI tool button on the right",
    "3. Watch as AI processes and transforms your text",
    "",
    "Try it now! Select some text and click an AI tool."
  ]

  useEffect(() => {
    initializeApp()
    checkBackendHealth()
  }, [])

  const initializeApp = () => {
    if (window.Office && window.Word) {
      Office.onReady((info) => {
        if (info.host === Office.HostType.Word) {
          setIsWordConnected(true)
          setStatus('✅ Connected to Microsoft Word - Select text and use AI tools')
        }
      }).catch(() => {
        setStatus('⚠️ Office.js error - Running in browser mode')
      })
    } else {
      setStatus('🌐 Browser Mode - Open in Word Online for full features')
    }
  }

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackendHealth({ status: 'healthy', ...data })
      } else {
        setBackendHealth({ status: 'unhealthy', error: `HTTP ${response.status}` })
      }
    } catch (error) {
      setBackendHealth({ status: 'offline', error: error.message })
    }
  }

  const playSound = (type) => {
    // Simple beep sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = type === 'success' ? 800 : 400
    gainNode.gain.value = 0.1
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const handleAIAction = async (action, templateName = null) => {
    let textToProcess = selectedText
    
    // If no text selected and in Word, try to get selection
    if (!textToProcess && isWordConnected) {
      try {
        await Word.run(async (context) => {
          const selection = context.document.getSelection()
          selection.load('text')
          await context.sync()
          textToProcess = selection.text || ''
        })
      } catch (error) {
        console.warn('Could not get Word selection:', error)
      }
    }
    
    // If still no text, prompt user
    if (!textToProcess || textToProcess.trim() === '') {
      textToProcess = prompt(`Enter text to ${action}:`, 'This is a sample text for AI processing.')
      if (!textToProcess) return
    }
    
    setIsProcessing(true)
    setStatus(`⚡ Processing ${action}...`)
    playSound('click')

    try {
      const response = await fetch(`${BACKEND_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Office-Version': '1.0'
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          action,
          text: textToProcess,
          template_name: templateName,
          style: correctionStyle
        })
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const result = await response.json()

      // Update Word document if connected
      if (isWordConnected && window.Word && result.success) {
        try {
          await Word.run(async (context) => {
            const selection = context.document.getSelection()
            
            if (result.type === 'template') {
              // Insert template at end of document
              context.document.body.insertText(`\n\n=== ${result.template_name} ===\n\n`, 'End')
              context.document.body.insertText(result.content + '\n\n', 'End')
            } else if (result.type === 'text') {
              // Replace selected text
              selection.insertText(result.result, 'Replace')
            } else if (result.type === 'analysis') {
              // Insert analysis results
              const analysisText = `📊 Text Analysis:\nWords: ${result.word_count}\nSentences: ${result.sentence_count}\nReading Time: ${result.reading_time_minutes} min\nComplexity: ${result.complexity}`
              selection.insertText(analysisText, 'Replace')
            }
            
            await context.sync()
          })
        } catch (wordError) {
          console.warn('Word update failed:', wordError)
          // Fallback: Show result in alert
          showResultAlert(result)
        }
      } else {
        showResultAlert(result)
      }

      // Add to logs
      const logEntry = {
        action,
        timestamp: new Date().toISOString(),
        textLength: textToProcess.length,
        success: true
      }
      setLogs(prev => [logEntry, ...prev.slice(0, 9)])

      setStatus(`✅ ${action} completed successfully!`)
      playSound('success')
      
    } catch (error) {
      console.error('AI Action Error:', error)
      
      // Fallback mock response
      const mockResult = getMockResponse(action, textToProcess)
      showResultAlert(mockResult)
      
      const logEntry = {
        action,
        timestamp: new Date().toISOString(),
        textLength: textToProcess.length,
        success: false,
        error: error.message
      }
      setLogs(prev => [logEntry, ...prev.slice(0, 9)])
      
      setStatus(`⚠️ ${action} completed with mock data`)
    } finally {
      setIsProcessing(false)
    }
  }

  const showResultAlert = (result) => {
    let message = ''
    
    if (result.type === 'template') {
      message = `📄 ${result.template_name} Template Ready!\n\nVariables: ${result.variables.join(', ')}\n\nFill the template in your document.`
    } else if (result.type === 'text') {
      message = result.result
    } else if (result.type === 'analysis') {
      message = `📊 Text Analysis:\n\nWords: ${result.word_count}\nSentences: ${result.sentence_count}\nCharacters: ${result.character_count}\nReading Time: ${result.reading_time_minutes} min\nComplexity: ${result.complexity}`
    } else {
      message = JSON.stringify(result, null, 2)
    }
    
    alert(message.substring(0, 500) + (message.length > 500 ? '...' : ''))
  }

  const getMockResponse = (action, text) => {
    switch(action) {
      case 'autocorrect':
        return {
          type: 'text',
          result: `✅ Auto-corrected (${correctionStyle}):\n${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}.`
        }
      case 'template':
        return {
          type: 'template',
          template_name: 'Business Report',
          content: '# Business Report\n\n## Executive Summary\n[Your summary here]\n\n## Recommendations\n[Your recommendations here]',
          variables: ['title', 'summary', 'recommendations']
        }
      case 'summarize':
        return {
          type: 'text',
          result: `📝 Summary:\n${text.substring(0, 100)}...`
        }
      case 'analyze':
        return {
          type: 'analysis',
          word_count: text.split(' ').length,
          sentence_count: text.split('.').length - 1,
          character_count: text.length,
          reading_time_minutes: (text.split(' ').length / 200).toFixed(1),
          complexity: 'Moderate'
        }
      default:
        return {
          type: 'text',
          result: `Processed: ${action}`
        }
    }
  }

  const openWordOnline = () => {
    window.open('https://office.com/launch/word', '_blank', 'noopener,noreferrer')
  }

  const simulateTextSelection = (text) => {
    if (text.trim()) {
      setSelectedText(text)
      playSound('click')
    }
  }

  const AIButton = ({ icon, title, description, action, color, template }) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600', 
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600'
    }

    return (
      <button
        onClick={() => handleAIAction(action, template)}
        disabled={isProcessing}
        className={`group relative w-full p-5 bg-white rounded-xl border border-gray-200 hover:border-${color}-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorMap[color]} mb-3 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}>
            <i className={`bx ${icon} text-white text-xl`}></i>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          
          <div className="flex items-center text-blue-600 font-medium text-sm">
            <span>{isProcessing ? 'Processing...' : 'Try Now'}</span>
            <i className="bx bx-chevron-right ml-1 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
        
        {/* Animated background */}
        <div className={`absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-br ${colorMap[color]} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="glass-card mb-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="bx bx-bot text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Word Automator AI
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isWordConnected ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
                  <span className="text-gray-600">{status}</span>
                </div>
                {backendHealth && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${backendHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Backend: {backendHealth.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {!isWordConnected && (
              <button
                onClick={openWordOnline}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                <i className="bx bx-link-external"></i>
                Open Word Online
              </button>
            )}
            
            <button
              onClick={() => setActiveTab(activeTab === 'home' ? 'dashboard' : 'home')}
              className="btn-secondary flex items-center gap-2 px-4 py-2"
            >
              <i className={`bx ${activeTab === 'dashboard' ? 'bx-home' : 'bx-stats'}`}></i>
              {activeTab === 'dashboard' ? 'AI Tools' : 'Dashboard'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'home' ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <i className="bx bx-file text-blue-500"></i>
                  Document Preview
                </h2>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <i className="bx bx-mouse"></i>
                  Click to select text
                </div>
              </div>
              
              <div className="word-document max-h-[500px] overflow-y-auto">
                {documentContent.map((line, idx) => (
                  <p
                    key={idx}
                    onClick={() => simulateTextSelection(line)}
                    className={`cursor-pointer p-3 rounded-lg transition-all ${selectedText === line ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-blue-50'}`}
                  >
                    {line || <br />}
                  </p>
                ))}
              </div>
              
              {selectedText && (
                <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200 animate-slide-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                        <i className="bx bx-check-circle"></i>
                        Text Selected
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        "{selectedText.substring(0, 80)}{selectedText.length > 80 ? '...' : ''}"
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedText('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="bx bx-x text-xl"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Style Selection */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="bx bx-edit text-purple-500"></i>
                Writing Style
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['formal', 'casual', 'technical', 'creative'].map(style => (
                  <button
                    key={style}
                    onClick={() => setCorrectionStyle(style)}
                    className={`p-3 rounded-lg border-2 transition-all ${correctionStyle === style ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    <div className="font-medium capitalize">{style}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {style === 'formal' && 'Business & Reports'}
                      {style === 'casual' && 'Emails & Blogs'}
                      {style === 'technical' && 'Docs & Manuals'}
                      {style === 'creative' && 'Marketing & Stories'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Tools Sidebar */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">AI Tools</h2>
              <div className="space-y-4">
                <AIButton
                  icon="bx-magic-wand"
                  title="Auto-Correct"
                  description="Fix grammar & improve style"
                  action="autocorrect"
                  color="blue"
                />
                
                <AIButton
                  icon="bx-file-blank"
                  title="Generate Template"
                  description="Create structured documents"
                  action="template"
                  color="purple"
                  template={selectedTemplate}
                />
                
                <AIButton
                  icon="bx-compress"
                  title="Summarize Text"
                  description="Extract key points"
                  action="summarize"
                  color="green"
                />
                
                <AIButton
                  icon="bx-analyse"
                  title="Analyze Text"
                  description="Get writing insights"
                  action="analyze"
                  color="orange"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3">Select Template</h3>
              <div className="space-y-2">
                {['business_report', 'email_template', 'meeting_minutes'].map(template => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${selectedTemplate === template ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}
                  >
                    <div className="font-medium capitalize">
                      {template.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template === 'business_report' && 'Professional reports'}
                      {template === 'email_template' && 'Formal emails'}
                      {template === 'meeting_minutes' && 'Meeting documentation'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
              <h3 className="font-bold text-gray-800 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Selected Text</span>
                  <span className="font-bold">{selectedText.length} chars</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Style</span>
                  <span className="font-bold capitalize">{correctionStyle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Template</span>
                  <span className="font-bold capitalize">{selectedTemplate.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Actions</span>
                  <span className="font-bold">{logs.filter(l => l.success).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DashboardView logs={logs} backendHealth={backendHealth} />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <i className="bx bx-loader-alt text-2xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">AI Processing</h3>
            <p className="text-gray-600">Your text is being processed by AI...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DashboardView = ({ logs, backendHealth }) => {
  const stats = {
    totalActions: logs.length,
    successfulActions: logs.filter(l => l.success).length,
    todayActions: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    avgProcessingTime: '0.5s'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="bx-rocket"
            title="Total Actions"
            value={stats.totalActions}
            color="blue"
            trend="+12%"
          />
          <StatCard
            icon="bx-check-circle"
            title="Successful"
            value={stats.successfulActions}
            color="green"
            trend="98%"
          />
          <StatCard
            icon="bx-time"
            title="Today"
            value={stats.todayActions}
            color="purple"
            trend="Today"
          />
          <StatCard
            icon="bx-timer"
            title="Avg. Time"
            value={stats.avgProcessingTime}
            color="orange"
            trend="Fast"
          />
        </div>

        {/* Backend Status */}
        {backendHealth && (
          <div className={`p-4 rounded-lg mb-6 ${backendHealth.status === 'healthy' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${backendHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <h4 className="font-bold text-gray-800">Backend Status</h4>
                  <p className="text-sm text-gray-600">
                    {backendHealth.status === 'healthy' 
                      ? 'Connected and responding normally' 
                      : `Issue: ${backendHealth.error || 'Connection problem'}`}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${backendHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {backendHealth.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium capitalize">{log.action}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Text Length: {log.textLength} chars</span>
                      <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                        {log.success ? '✓ Success' : '✗ Failed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <i className="bx bx-time text-4xl mb-2"></i>
                <p>No activity yet</p>
                <p className="text-sm">Use AI tools to see activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon, title, value, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-2">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${colorClasses[color]}`}>
              {trend}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <i className={`bx ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  )
}

export default App