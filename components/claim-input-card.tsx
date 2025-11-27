"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { FileText, LinkIcon, ImageIcon, Eye, EyeOff, Loader2, Sparkles } from "lucide-react"

export function ClaimInputCard() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      if (text) formData.append('text', text)
      if (url) formData.append('url', url)
      formData.append('public', isPublic.toString())

      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        // Redirect to results with verification data
        const claim = text || url || 'Unknown'
        if (result.verificationId) {
          router.push(`/results?claim=${encodeURIComponent(claim)}&verificationId=${result.verificationId}`)
        } else {
          // If no verification ID, pass the result data directly via state
          router.push(`/results?claim=${encodeURIComponent(claim)}&data=${encodeURIComponent(JSON.stringify(result))}`)
        }
      } else {
        console.error('Verification failed:', result.error)
        // Show error to user
        alert(`Verification failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Verification error:', error)
      // Fallback to old behavior
      const claim = text || url
      if (claim) {
        router.push(`/results?claim=${encodeURIComponent(claim)}&public=${isPublic}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="text" className="w-full">
            <div className="border-b px-5 pt-5">
              <TabsList className="w-full grid grid-cols-3 h-11">
                <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-background">
                  <FileText className="w-4 h-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-background">
                  <LinkIcon className="w-4 h-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-background">
                  <ImageIcon className="w-4 h-4" />
                  Image
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-5 space-y-5">
              <TabsContent value="text" className="mt-0 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="claim-text" className="text-muted-foreground">
                    Enter a claim to verify
                  </Label>
                  <Textarea
                    id="claim-text"
                    placeholder="e.g., Coffee reduces the risk of heart disease by 30%"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-0 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="claim-url" className="text-muted-foreground">
                    Paste an article or social media URL
                  </Label>
                  <Input
                    id="claim-url"
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="image" className="mt-0 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="claim-image" className="text-muted-foreground">
                    Upload a screenshot
                  </Label>
                  <div className="border-2 border-dashed p-8 text-center hover:border-foreground/20 transition-colors cursor-pointer">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop or click to upload</p>
                    <Input id="claim-image" type="file" accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <div className="flex items-center justify-between p-4 bg-muted/50 border">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{isPublic ? "Public" : "Private"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPublic ? "Visible on Explore (anonymous)" : "Only in your History"}
                    </p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading || (!text && !url)}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Verify Claim
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}
