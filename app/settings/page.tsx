"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Shield, Palette, Save, Loader2 } from "lucide-react"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [profileVisibility, setProfileVisibility] = useState("public")
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true)
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fetch user settings
  const { data: userSettings, error: fetchError } = useSWR(
    session ? "/api/user/settings" : null,
    fetcher
  )

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Update form when user data loads
  useEffect(() => {
    if (userSettings?.user) {
      setName(userSettings.user.name || "")
      setEmail(userSettings.user.email || "")
    }
  }, [userSettings])

  const handleSave = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess("Settings updated successfully!")
        // Refresh the user settings data
        mutate("/api/user/settings")
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "Failed to update settings")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = () => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase()
    }
    return "U"
  }

  const getJoinDate = () => {
    if (userSettings?.user?.createdAt) {
      return new Date(userSettings.user.createdAt).toLocaleDateString()
    }
    return "Unknown"
  }

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {error && (
          <div className="mb-4 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 text-sm bg-green-500/10 text-green-600 border border-green-500/20 rounded">
            {success}
          </div>
        )}

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">
                <p>Member since {getJoinDate()}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your data and visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Profile Visibility</Label>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show on Leaderboard</p>
                <p className="text-sm text-muted-foreground">Display your ranking publicly</p>
              </div>
              <Switch 
                checked={showOnLeaderboard} 
                onCheckedChange={setShowOnLeaderboard}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Anonymous Mode</p>
                <p className="text-sm text-muted-foreground">Hide your identity from public searches</p>
              </div>
              <Switch 
                checked={anonymousMode} 
                onCheckedChange={setAnonymousMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            className="gap-2" 
            onClick={handleSave}
            disabled={isLoading || !name.trim() || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
