"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/cafe`,
        },
      })
      if (error) throw error
      router.push("/cafe")
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
            <CardTitle className="text-3xl font-serif text-amber-900 dark:text-amber-100">Welcome Back</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Sign in to The Poets Corner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">{error}</p>
              )}
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-amber-700 dark:text-amber-300">
              New to The Poets Corner?{" "}
              <Link href="/auth/signup" className="font-medium text-amber-800 dark:text-amber-200 hover:underline">
                Join our community
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
