import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-amber-200 dark:border-amber-800 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif text-amber-900 dark:text-amber-100">
              Welcome to The Corner!
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Check your email to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              We've sent you a confirmation email. Please check your inbox and click the link to activate your account.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Once confirmed, you'll be able to share your poetry and connect with fellow writers.
            </p>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
