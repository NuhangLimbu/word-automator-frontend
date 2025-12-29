import React, { useState, useEffect } from 'react'
import 'boxicons/css/boxicons.min.css'

function App() {
  const [status, setStatus] = useState('🚀 Initializing Word Automator AI...')
  const [activeTab, setActiveTab] = useState('home')
  const [selectedText, setSelectedText] = useState('')
  const [isWordOnline, setIsWordOnline] = useState(false)
  
  const documentContent = [
    "# Welcome to Word Automator AI",
    "Select text and use AI tools below:",
    "",
    "This is a demonstration of AI-powered document automation.",
    "Features include:",
    "• Auto-correction of grammar and spelling",
    "• Template generation",
    "• Text summarization",
    "• Style analysis",
    "",
    "Try selecting any text above and clicking an AI tool!"
  ]

  useEffect(() => {
    // Check if running in Word
    if (window.Office) {
      setIsWordOnline(true)
      Office.onReady(() => {
        setStatus('✅ Connected to Microsoft Word')
      })
    } else {
      setStatus('🌐 Standalone mode - Open in Word Online for full features')
    }
  }, [])

  const handleAIAction = (action) => {
    if (!selectedText) {
      alert('Please select text from the document first!')
      return
    }
    
    setStatus(`⚡ Processing ${action}...`)
    
    // Simulate AI processing
    setTimeout(() => {
      setStatus(`✅ ${action} completed successfully!`)
      alert(`${action} Result:\n\n"${selectedText.substring(0, 100)}..."\n\n→ AI processed with ${action}`)
    }, 1500)
  }

  const openWordOnline = () => {
    window.open('https://office.com/launch/word', '_blank')
  }

  const AIButton = ({ icon, title, description, action, color }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600'
    }
    
    return (
      <button
        onClick={() => handleAIAction(title)}
        className="group relative w-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
        
        <div className="relative z-10">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} mb-4 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}>
            <i className={`bx ${icon} text-white text-2xl`}></i>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          <div className="flex items-center text-blue-600 font-medium">
            <span>Try Now</span>
            <i className="bx bx-chevron-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4">
      {/* Header */}
      <div className="glass-card mb-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="bx bx-bot text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Word Automator AI
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isWordOnline ? 'animate-pulse bg-green-500' : 'bg-blue-500'}`}></span>
                {status}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isWordOnline && (
              <button
                onClick={openWordOnline}
                className="btn-primary flex items-center gap-2"
              >
                <i className="bx bx-link-external"></i>
                Open Word Online
              </button>
            )}
            
            <button
              onClick={() => setActiveTab(activeTab === 'home' ? 'dashboard' : 'home')}
              className="btn-secondary flex items-center gap-2"
            >
              <i className={`bx ${activeTab === 'dashboard' ? 'bx-home' : 'bx-stats'}`}></i>
              {activeTab === 'dashboard' ? 'AI Tools' : 'Dashboard'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'home' ? (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document */}
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
              
              <div className="word-document">
                {documentContent.map((line, idx) => (
                  <p
                    key={idx}
                    onClick={() => setSelectedText(line)}
                    className={`cursor-pointer p-3 rounded-lg transition-all ${selectedText === line ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-blue-50'}`}
                  >
                    {line || <br />}
                  </p>
                ))}
              </div>
              
              {selectedText && (
                <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200 animate-slide-in">
                  <p className="text-sm text-blue-800 font-medium">
                    <i className="bx bx-check-circle mr-2"></i>
                    Selected: "{selectedText.substring(0, 80)}..."
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI Tools */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">AI Tools</h2>
            
            <AIButton
              icon="bx-magic-wand"
              title="Auto-Correct"
              description="Fix grammar & improve writing style"
              action="Auto-Correct"
              color="blue"
            />
            
            <AIButton
              icon="bx-file-blank"
              title="Generate Template"
              description="Create structured documents"
              action="Template"
              color="purple"
            />
            
            <AIButton
              icon="bx-compress"
              title="Summarize"
              description="Extract key points automatically"
              action="Summarize"
              color="green"
            />
            
            <AIButton
              icon="bx-analyse"
              title="Analyze"
              description="Get writing insights & metrics"
              action="Analyze"
              color="orange"
            />
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <h3 className="font-bold text-gray-800 mb-2">System Status</h3>
                <div className="text-3xl font-bold text-blue-600">Online</div>
                <p className="text-gray-600 text-sm mt-2">Ready to process</p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <h3 className="font-bold text-gray-800 mb-2">Templates</h3>
                <div className="text-3xl font-bold text-purple-600">8</div>
                <p className="text-gray-600 text-sm mt-2">Available templates</p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <h3 className="font-bold text-gray-800 mb-2">Usage</h3>
                <div className="text-3xl font-bold text-green-600">24</div>
                <p className="text-gray-600 text-sm mt-2">AI actions today</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-4">Quick Templates</h3>
                <div className="space-y-3">
                  {['Business Report', 'Email Draft', 'Meeting Notes', 'Project Proposal'].map(template => (
                    <button
                      key={template}
                      className="w-full p-4 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{template}</span>
                        <i className="bx bx-chevron-right text-gray-400"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {['Auto-Correction applied', 'Template generated', 'Text summarized', 'Document analyzed'].map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">{activity}</span>
                      </div>
                      <span className="text-sm text-gray-500">2 min ago</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App