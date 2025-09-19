import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Calendar, Clock, Award, Plus } from "lucide-react"

export default async function ContestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get active contests
  const { data: activeContests } = await supabase
    .from("contests")
    .select("*")
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString())
    .order("end_date", { ascending: true })

  // Get past contests
  const { data: pastContests } = await supabase
    .from("contests")
    .select("*")
    .lt("end_date", new Date().toISOString())
    .order("end_date", { ascending: false })
    .limit(5)

  // Get user's submissions
  const { data: userSubmissions } = await supabase
    .from("contest_submissions")
    .select("contest_id")
    .eq("user_id", user.id)

  const submittedContestIds = new Set(userSubmissions?.map((s) => s.contest_id) || [])

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} days left`
    if (hours > 0) return `${hours} hours left`
    return "Ending soon"
  }

  const getContestProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()

    if (now < start) return 0
    if (now > end) return 100

    return Math.round(((now - start) / (end - start)) * 100)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Writing Contests</h1>
              <p className="text-muted-foreground">Challenge yourself and showcase your talent</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </div>

          {/* Active Contests */}
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Active Contests</h2>
            {activeContests && activeContests.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {activeContests.map((contest) => (
                  <Card key={contest.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-serif flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            {contest.title}
                          </CardTitle>
                          <CardDescription className="mt-2 text-pretty">{contest.description}</CardDescription>
                        </div>
                        {submittedContestIds.has(contest.id) && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            Submitted
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Ends {new Date(contest.end_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {getTimeRemaining(contest.end_date)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Contest Progress</span>
                          <span>{getContestProgress(contest.start_date, contest.end_date)}%</span>
                        </div>
                        <Progress value={getContestProgress(contest.start_date, contest.end_date)} className="h-2" />
                      </div>

                      {contest.theme && (
                        <div>
                          <Badge variant="outline">Theme: {contest.theme}</Badge>
                        </div>
                      )}

                      {contest.prize_description && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                          <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Prize</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">{contest.prize_description}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button asChild className="flex-1">
                          <Link href={`/contests/${contest.id}`}>
                            {submittedContestIds.has(contest.id) ? "View Submission" : "Enter Contest"}
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/contests/${contest.id}/leaderboard`}>
                            <Trophy className="h-4 w-4 mr-2" />
                            Leaderboard
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No active contests</h3>
                  <p className="text-muted-foreground mb-4">Check back soon for new writing challenges!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Past Contests */}
          {pastContests && pastContests.length > 0 && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Recent Contests</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastContests.map((contest) => (
                  <Card key={contest.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-3">
                      <CardTitle className="font-serif text-lg">{contest.title}</CardTitle>
                      <CardDescription className="text-sm">
                        Ended {new Date(contest.end_date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                        <Link href={`/contests/${contest.id}/results`}>View Results</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
