import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Award, Star, TrendingUp, Crown, Medal } from "lucide-react"

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get top users by points
  const { data: topUsers } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, points, badges")
    .order("points", { ascending: false })
    .limit(50)

  // Get most liked posts this month
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const { data: topPosts } = await supabase
    .from("posts")
    .select(
      `
      id,
      title,
      likes_count,
      created_at,
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("is_published", true)
    .gte("created_at", oneMonthAgo.toISOString())
    .order("likes_count", { ascending: false })
    .limit(20)

  // Get most active commenters
  const { data: topCommenters } = await supabase
    .from("comments")
    .select(
      `
      author_id,
      profiles!comments_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `,
    )
    .gte("created_at", oneMonthAgo.toISOString())

  // Count comments per user
  const commenterCounts = topCommenters?.reduce(
    (acc, comment) => {
      const userId = comment.author_id
      if (!acc[userId]) {
        acc[userId] = {
          count: 0,
          profile: comment.profiles,
        }
      }
      acc[userId].count++
      return acc
    },
    {} as Record<string, { count: number; profile: any }>,
  )

  const sortedCommenters = Object.entries(commenterCounts || {})
    .map(([userId, data]) => ({
      userId,
      ...data,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case 2:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case 3:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground">Leaderboard</h1>
            <p className="text-muted-foreground">Celebrate our most active and talented community members</p>
          </div>

          <Tabs defaultValue="points" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="points">
                <Trophy className="h-4 w-4 mr-2" />
                Top Points
              </TabsTrigger>
              <TabsTrigger value="posts">
                <Star className="h-4 w-4 mr-2" />
                Popular Posts
              </TabsTrigger>
              <TabsTrigger value="engagement">
                <TrendingUp className="h-4 w-4 mr-2" />
                Most Active
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Contributors by Points
                  </CardTitle>
                  <CardDescription>
                    Users with the highest point totals from posting, commenting, and receiving likes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsers && topUsers.length > 0 ? (
                    <div className="space-y-4">
                      {topUsers.map((profile, index) => (
                        <div
                          key={profile.username}
                          className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8">{getRankIcon(index + 1)}</div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.display_name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {profile.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profile/${profile.username}`}
                                className="font-medium text-foreground hover:text-primary transition-colors"
                              >
                                {profile.display_name}
                              </Link>
                              <span className="text-muted-foreground text-sm">@{profile.username}</span>
                              {index < 3 && <Badge className={getRankBadge(index + 1)}>Top {index + 1}</Badge>}
                            </div>
                            {profile.badges && profile.badges.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {profile.badges.slice(0, 3).map((badge) => (
                                  <Badge key={badge} variant="secondary" className="text-xs">
                                    {badge}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">{profile.points}</div>
                            <div className="text-xs text-muted-foreground">points</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No data available yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Most Liked Posts This Month
                  </CardTitle>
                  <CardDescription>Posts that received the most likes in the past 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {topPosts && topPosts.length > 0 ? (
                    <div className="space-y-4">
                      {topPosts.map((post, index) => (
                        <div
                          key={post.id}
                          className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8">{getRankIcon(index + 1)}</div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={post.profiles.avatar_url || "/placeholder.svg"}
                              alt={post.profiles.display_name}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {post.profiles.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Link
                              href={`/post/${post.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors block text-balance"
                            >
                              {post.title}
                            </Link>
                            <div className="text-sm text-muted-foreground">
                              by {post.profiles.display_name} • {new Date(post.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-500">{post.likes_count}</div>
                            <div className="text-xs text-muted-foreground">likes</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No posts found for this period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Most Active Commenters This Month
                  </CardTitle>
                  <CardDescription>Users who have been most engaged in discussions</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedCommenters.length > 0 ? (
                    <div className="space-y-4">
                      {sortedCommenters.map((commenter, index) => (
                        <div
                          key={commenter.userId}
                          className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8">{getRankIcon(index + 1)}</div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={commenter.profile.avatar_url || "/placeholder.svg"}
                              alt={commenter.profile.display_name}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {commenter.profile.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profile/${commenter.profile.username}`}
                                className="font-medium text-foreground hover:text-primary transition-colors"
                              >
                                {commenter.profile.display_name}
                              </Link>
                              <span className="text-muted-foreground text-sm">@{commenter.profile.username}</span>
                              {index < 3 && <Badge className={getRankBadge(index + 1)}>Most Active</Badge>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-500">{commenter.count}</div>
                            <div className="text-xs text-muted-foreground">comments</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No activity data available yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
