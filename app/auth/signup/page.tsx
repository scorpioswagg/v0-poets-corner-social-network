"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/cafe`,
          data: {
            username,
            display_name: displayName || username,
            bio: bio || "A new voice in The Poets Corner",
          },
        },
      })
      if (error) throw error
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-amber-200 dark:border-amber-800 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif text-amber-900 dark:text-amber-100">Join The Corner</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Create your poet profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-800 dark:text-amber-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="poet@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-amber-800 dark:text-amber-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="wordsmith"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-amber-800 dark:text-amber-200">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Poet Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-amber-800 dark:text-amber-200">
                  Bio (Optional)
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your writing..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="border-amber-300 focus:border-amber-500 dark:border-amber-700 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-amber-800 dark:text-amber-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-amber-800 dark:text-amber-200">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">{error}</p>
              )}
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Join The Poets Corner"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-amber-700 dark:text-amber-300">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-amber-800 dark:text-amber-200 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
