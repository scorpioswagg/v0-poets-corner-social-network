import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-amber-200 dark:border-amber-800 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif text-amber-900 dark:text-amber-100">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {params?.error ? (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded">
                {params.error}
              </p>
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-300">An authentication error occurred.</p>
            )}
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/auth/login">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
