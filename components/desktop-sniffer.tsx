"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Monitor, 
  Eye, 
  EyeOff, 
  Copy, 
  Link, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react"

interface DetectionLog {
  id: string
  timestamp: Date
  content: string
  type: 'link' | 'text' | 'short'
  length: number
  recommendation: string
  analyzed?: boolean
  analysisResult?: any
}

export function DesktopSniffer() {
  const [isActive, setIsActive] = useState(false)
  const [logs, setLogs] = useState<DetectionLog[]>([])
  const [lastClipboard, setLastClipboard] = useState("")
  const intervalRef = useRef<NodeJS.Timeout>()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Clipboard monitoring function
  const checkClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const current = await navigator.clipboard.readText()
        
        if (current !== lastClipboard && current.trim()) {
          setLastClipboard(current)
          
          // Determine content type and recommendation
          let type: 'link' | 'text' | 'short' = 'short'
          let recommendation = "Content too short for analysis."
          
          if (current.startsWith("http")) {
            type = 'link'
            recommendation = "Run Link Safety Agent."
          } else if (current.length > 50) {
            type = 'text'
            recommendation = "Run AI/Propaganda Detector."
          }
          
          const newLog: DetectionLog = {
            id: Date.now().toString(),
            timestamp: new Date(),
            content: current,
            type,
            length: current.length,
            recommendation,
            analyzed: false
          }
          
          setLogs(prev => [newLog, ...prev.slice(0, 49)]) // Keep last 50
          
          // Auto-scroll to top
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = 0
            }
          }, 100)
        }
      }
    } catch (error) {
      console.log("Clipboard access not available or denied")
    }
  }

  // Start/stop monitoring
  const toggleMonitoring = () => {
    if (isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setIsActive(false)
    } else {
      // Request clipboard permission first
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.readText().then(() => {
          setIsActive(true)
          intervalRef.current = setInterval(checkClipboard, 1000)
        }).catch(() => {
          alert("Clipboard access required for TruthMate Desktop Watchdog. Please allow clipboard permissions.")
        })
      }
    }
  }

  // Analyze detected content
  const analyzeContent = async (log: DetectionLog) => {
    try {
      setLogs(prev => prev.map(l => 
        l.id === log.id ? { ...l, analyzed: 'analyzing' } : l
      ))

      let result = null
      
      if (log.type === 'link') {
        // Analyze URL with TruthMate OS
        const response = await fetch('http://localhost:5000/truthmate-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: log.content })
        })
        
        if (response.ok) {
          result = await response.json()
        }
      } else if (log.type === 'text') {
        // Analyze text content
        const response = await fetch('http://localhost:5000/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: log.content })
        })
        
        if (response.ok) {
          result = await response.json()
        }
      }
      
      setLogs(prev => prev.map(l => 
        l.id === log.id ? { ...l, analyzed: true, analysisResult: result } : l
      ))
    } catch (error) {
      setLogs(prev => prev.map(l => 
        l.id === log.id ? { ...l, analyzed: false } : l
      ))
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <CardHeader className="pb-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="relative">
              <Monitor className="w-8 h-8 text-green-400" />
              {isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              TruthMate Desktop Watchdog
            </span>
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <Badge 
              className={`px-3 py-1 ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
              }`}
            >
              {isActive ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  ACTIVE
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  STANDBY
                </>
              )}
            </Badge>
            
            <Button
              onClick={toggleMonitoring}
              className={`${
                isActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isActive ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 font-mono">
          {isActive 
            ? "Monitoring clipboard for new content... Copy text or links to see analysis."
            : "Click 'Start Monitoring' to activate clipboard watching."
          }
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Status Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{logs.length}</div>
              <div className="text-xs text-gray-400 uppercase">Detections</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                {logs.filter(l => l.analyzed === true).length}
              </div>
              <div className="text-xs text-gray-400 uppercase">Analyzed</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">
                {logs.filter(l => l.type === 'link').length}
              </div>
              <div className="text-xs text-gray-400 uppercase">Links</div>
            </div>
          </div>

          {/* Detection Logs */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-green-400 flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Detection Log
            </h4>
            
            <ScrollArea className="h-[400px] w-full" ref={scrollRef}>
              <div className="space-y-3 pr-4">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Copy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No clipboard activity detected yet.</p>
                    <p className="text-sm mt-1">Copy some text or links to start monitoring.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:border-gray-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            log.type === 'link' ? 'bg-blue-500/20 text-blue-400' :
                            log.type === 'text' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {log.type === 'link' ? <Link className="w-4 h-4" /> :
                             log.type === 'text' ? <FileText className="w-4 h-4" /> :
                             <AlertTriangle className="w-4 h-4" />}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${
                                log.type === 'link' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                log.type === 'text' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/50'
                              }`}>
                                {log.type.toUpperCase()}
                              </Badge>
                              
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-400 mt-1">
                              {log.length} characters • {log.recommendation}
                            </div>
                          </div>
                        </div>
                        
                        {log.type !== 'short' && (
                          <Button
                            size="sm"
                            onClick={() => analyzeContent(log)}
                            disabled={log.analyzed === 'analyzing' || log.analyzed === true}
                            className={`${
                              log.analyzed === true ? 'bg-green-600/20 text-green-400 border-green-500/50' :
                              log.analyzed === 'analyzing' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50' :
                              'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {log.analyzed === true ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Analyzed
                              </>
                            ) : log.analyzed === 'analyzing' ? (
                              <>
                                <Activity className="w-3 h-3 mr-1 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              'Analyze'
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {/* Content Preview */}
                      <div className="bg-black/50 p-3 rounded border border-gray-700/50 font-mono text-sm">
                        <div className="text-green-400 mb-1 text-xs">
                          [DETECTED] {log.type === 'link' ? 'Link' : 'Text Block'}:
                        </div>
                        <div className="text-white break-all">
                          {log.content.length > 100 
                            ? `${log.content.substring(0, 100)}...` 
                            : log.content
                          }
                        </div>
                      </div>
                      
                      {/* Analysis Results */}
                      {log.analysisResult && (
                        <div className="mt-3 p-3 bg-green-900/20 border border-green-700/50 rounded">
                          <div className="text-green-400 text-sm font-semibold mb-2">
                            🔍 Analysis Results:
                          </div>
                          
                          {log.type === 'link' && log.analysisResult.safety_score && (
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-gray-400">Safety Score:</span>
                                <span className={`ml-2 font-bold ${
                                  log.analysisResult.safety_score >= 80 ? 'text-green-400' :
                                  log.analysisResult.safety_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {log.analysisResult.safety_score}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Risk Type:</span>
                                <span className={`ml-2 font-bold uppercase ${
                                  log.analysisResult.risk_type === 'safe' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {log.analysisResult.risk_type}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {log.type === 'text' && log.analysisResult.verdict && (
                            <div className="text-sm">
                              <span className="text-gray-400">Verdict:</span>
                              <span className={`ml-2 font-bold ${
                                log.analysisResult.verdict === 'TRUE' ? 'text-green-400' :
                                log.analysisResult.verdict === 'FALSE' ? 'text-red-400' : 'text-yellow-400'
                              }`}>
                                {log.analysisResult.verdict}
                              </span>
                              <span className="ml-2 text-gray-400">
                                ({log.analysisResult.confidence?.toFixed(0)}% confidence)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}