"use client"

import type React from "react"
import { useState, useRef } from "react"
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // If image is provided, use deepfake analysis
      if (selectedImage) {
        console.log('🖼️ Starting Image Analysis:', selectedImage.name)
        
        const formData = new FormData()
        formData.append('image', selectedImage)
        
        const response = await fetch('http://localhost:5000/analyze-image', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (response.ok && result.success) {
          console.log('✅ Image Analysis Complete:', result)
          
          // Redirect with image analysis data
          router.push(`/results?claim=${encodeURIComponent(selectedImage.name)}&image=true&data=${encodeURIComponent(JSON.stringify(result))}`)
          return
        } else {
          console.error('Image analysis failed:', result.error)
          alert(`Image analysis failed: ${result.error}`)
          return
        }
      }
      
      // If URL is provided, use TruthMate OS style analysis
      if (url && url.trim()) {
        console.log('🕵️ Starting TruthMate OS URL analysis:', url)
        
        // Call TruthMate analysis endpoint
        const truthmateResponse = await fetch('http://localhost:5000/truthmate-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: url.trim() })
        })

        const truthmateResult = await truthmateResponse.json()
        
        if (truthmateResponse.ok && truthmateResult.success) {
          console.log('✅ TruthMate OS Analysis Complete:', truthmateResult)
          
          // Redirect with TruthMate OS analysis data
          router.push(`/results?claim=${encodeURIComponent(url)}&truthmate=true&data=${encodeURIComponent(JSON.stringify(truthmateResult))}`)
          return
        } else {
          console.warn('TruthMate OS analysis failed, falling back to standard verification')
        }
      }

      // Standard verification for text or fallback
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
          router.push(`/results?claim=${encodeURIComponent(claim)}&verificationId=${result.verificationId}&isPublic=${isPublic}`)
        } else {
          // If no verification ID, pass the result data directly via state
          router.push(`/results?claim=${encodeURIComponent(claim)}&data=${encodeURIComponent(JSON.stringify(result))}&isPublic=${isPublic}`)
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
        router.push(`/results?claim=${encodeURIComponent(claim)}&isPublic=${isPublic}`)
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
                    Upload an image for deepfake detection
                  </Label>
                  <div 
                    className="border-2 border-dashed p-8 text-center hover:border-foreground/20 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">{selectedImage?.name}</p>
                          <p>Size: {selectedImage ? (selectedImage.size / 1024 / 1024).toFixed(2) : 0}MB</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(null)
                            setImagePreview(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Click to upload an image for analysis</p>
                        <p className="text-xs text-muted-foreground mb-2">Supports: JPG, PNG, GIF, BMP (Max 10MB)</p>
                        <Button type="button" variant="outline" size="sm">
                          Choose Image
                        </Button>
                      </>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
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

              <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading || (!text && !url && !selectedImage)}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {selectedImage ? 'Analyzing Image...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {selectedImage ? 'Analyze Image' : 'Verify Claim'}
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
