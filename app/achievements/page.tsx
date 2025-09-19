import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AchievementBadge } from "@/components/achievement-badge"
import { Progress } from "@/components/ui/progress"
import { redirect } from "next/navigation"
import { Trophy, Star, Target, Award } from "lucide-react"

export default async function AchievementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with badges
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, points, badges")
    .eq("id", user.id)
    .single()

  // Get user stats for progress tracking
  const { data: userStats } = await supabase.rpc("get_leaderboard_stats").eq("user_id", user.id).single()

  const achievements = [
    {
      id: "first-post",
      name: "First Post",
      description: "Published your first piece of writing",
      requirement: "Publish 1 post",
      progress: Math.min(userStats?.posts_count || 0, 1),
      maxProgress: 1,
      earned: profile?.badges?.includes("First Post") || false,
    },
    {
      id: "prolific-writer",
      name: "Prolific Writer",
      description: "A dedicated writer with many published works",
      requirement: "Publish 10 posts",
      progress: Math.min(userStats?.posts_count || 0, 10),
      maxProgress: 10,
      earned: profile?.badges?.includes("Prolific Writer") || false,
    },
    {
      id: "rising-star",
      name: "Rising Star",
      description: "Your work is gaining recognition",
      requirement: "Receive 50 total likes",
      progress: Math.min(userStats?.likes_received || 0, 50),
      maxProgress: 50,
      earned: profile?.badges?.includes("Rising Star") || false,
    },
    {
      id: "popular-poet",
      name: "Popular Poet",
      description: "Your poetry resonates with many readers",
      requirement: "Receive 100 total likes",
      progress: Math.min(userStats?.likes_received || 0, 100),
      maxProgress: 100,
      earned: profile?.badges?.includes("Popular Poet") || false,
    },
    {
      id: "conversation-starter",
      name: "Conversation Starter",
      description: "Active in community discussions",
      requirement: "Make 50 comments",
      progress: Math.min(userStats?.comments_made || 0, 50),
      maxProgress: 50,
      earned: profile?.badges?.includes("Conversation Starter") || false,
    },
    {
      id: "contest-winner",
      name: "Contest Winner",
      description: "Won a writing contest",
      requirement: "Win a contest",
      progress: profile?.badges?.includes("Contest Winner") ? 1 : 0,
      maxProgress: 1,
      earned: profile?.badges?.includes("Contest Winner") || false,
    },
    {
      id: "community-champion",
      name: "Community Champion",
      description: "A pillar of The Poets Corner community",
      requirement: "Reach 1000 points",
      progress: Math.min(profile?.points || 0, 1000),
      maxProgress: 1000,
      earned: profile?.badges?.includes("Community Champion") || false,
    },
    {
      id: "mentor",
      name: "Mentor",
      description: "Helps and guides other writers",
      requirement: "Special recognition",
      progress: profile?.badges?.includes("Mentor") ? 1 : 0,
      maxProgress: 1,
      earned: profile?.badges?.includes("Mentor") || false,
    },
  ]

  const earnedCount = achievements.filter((a) => a.earned).length
  const totalCount = achievements.length

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground">Achievements</h1>
            <p className="text-muted-foreground">Track your progress and celebrate your milestones</p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Your Progress
              </CardTitle>
              <CardDescription>
                You've earned {earnedCount} out of {totalCount} achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Achievement Progress</span>
                  <span>
                    {earnedCount}/{totalCount} ({Math.round((earnedCount / totalCount) * 100)}%)
                  </span>
                </div>
                <Progress value={(earnedCount / totalCount) * 100} className="h-3" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{profile?.points || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{userStats?.posts_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Posts Published</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{userStats?.likes_received || 0}</div>
                    <div className="text-sm text-muted-foreground">Likes Received</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{userStats?.comments_made || 0}</div>
                    <div className="text-sm text-muted-foreground">Comments Made</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earned Badges */}
          {profile?.badges && profile.badges.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Your Badges
                </CardTitle>
                <CardDescription>Achievements you've unlocked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <AchievementBadge key={badge} achievement={badge} size="md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Achievements */}
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6" />
              All Achievements
            </h2>

            <div className="grid gap-4">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`transition-all ${
                    achievement.earned
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {achievement.earned ? (
                          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Star className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{achievement.name}</h3>
                            {achievement.earned && <AchievementBadge achievement={achievement.name} size="sm" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Requirement: {achievement.requirement}</p>
                        </div>

                        {!achievement.earned && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>
                                {achievement.progress}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
