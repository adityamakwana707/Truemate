"use client"

import { Header } from "@/components/header"
import { DesktopSniffer } from "@/components/desktop-sniffer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, Shield, Activity, Eye } from "lucide-react"

export default function DesktopWatchdogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Monitor className="w-12 h-12 text-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                TruthMate Desktop Watchdog
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Advanced clipboard monitoring system that automatically detects and analyzes 
              copied links and text content in real-time for security threats and misinformation.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-300 px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Real-time Protection
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300 px-4 py-2">
                <Activity className="w-4 h-4 mr-2" />
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-300 px-4 py-2">
                <Eye className="w-4 h-4 mr-2" />
                Clipboard Analysis
              </Badge>
            </div>
          </div>

          {/* Feature Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Clipboard Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  Continuously watches your clipboard for new content and automatically categorizes links, text blocks, and short snippets.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-900/10 dark:to-cyan-900/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Automated Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Instantly analyzes detected URLs with TruthMate OS security protocols and text content with AI fact-checking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Real-time Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Provides immediate feedback with safety scores, risk classifications, and detailed analysis reports.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Desktop Sniffer Component */}
          <DesktopSniffer />

          {/* Instructions */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/50 dark:to-gray-900/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">How to Use TruthMate Desktop Watchdog</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    Activate Monitoring
                  </h4>
                  <p className="text-muted-foreground ml-8">
                    Click "Start Monitoring" to begin clipboard surveillance. You'll be prompted to grant clipboard access permissions.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Copy Content
                  </h4>
                  <p className="text-muted-foreground ml-8">
                    Copy any text or links to your clipboard as you normally would. The watchdog will automatically detect new content.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    View Detections
                  </h4>
                  <p className="text-muted-foreground ml-8">
                    All detected content appears in the log with automatic categorization and analysis recommendations.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    Analyze Threats
                  </h4>
                  <p className="text-muted-foreground ml-8">
                    Click "Analyze" on any detection to run comprehensive security and fact-checking analysis with instant results.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-300/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-yellow-600 shrink-0 mt-1" />
                  <div>
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Privacy & Security</h5>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      All clipboard monitoring happens locally in your browser. Content is only sent to analysis servers 
                      when you explicitly click "Analyze". No clipboard data is stored or transmitted without your consent.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}