"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Award, 
  Trophy, 
  Crown, 
  Star, 
  Medal,
  TrendingUp,
  Users,
  BookOpen,
  Gamepad2,
  MessageCircle,
  Image,
  Swords,
  Calendar,
  Heart,
  Eye,
  Zap
} from "lucide-react"

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  display_name: string
  avatar_url?: string
  points: number
  metric_value: number
  metric_type: string
}

interface CategoryStats {
  total_users: number
  total_points: number
  average_points: number
  top_performer: string
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null)
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({})
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overall")
  const [timeframe, setTimeframe] = useState("all")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
    }
    getUser()
  }, [supabase, router])

  useEffect(() => {
    if (user) {
      fetchLeaderboards()
      fetchCategoryStats()
    }
  }, [user, timeframe])

  const fetchLeaderboards = async () => {
    try {
      const leaderboardData: Record<string, LeaderboardEntry[]> = {}

      // Overall points leaderboard
      const { data: overallData, error: overallError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, points")
        .order("points", { ascending: false })
        .limit(10)

      if (!overallError && overallData) {
        leaderboardData.overall = overallData.map((user, index) => ({
          rank: index + 1,
          user_id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          points: user.points,
          metric_value: user.points,
          metric_type: "points"
        }))
      }

      // Poems written leaderboard
      const { data: poemsData, error: poemsError } = await supabase
        .from("posts")
        .select(`
          author_id,
          profiles!posts_author_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (!poemsError && poemsData) {
        const poemCounts = poemsData.reduce((acc, post) => {
          const userId = post.author_id
          acc[userId] = (acc[userId] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const poemLeaderboard = Object.entries(poemCounts)
          .map(([userId, count]) => {
            const userData = poemsData.find(p => p.author_id === userId)?.profiles
            return {
              user_id: userId,
              username: userData?.username || "Unknown",
              display_name: userData?.display_name || "Unknown",
              avatar_url: userData?.avatar_url,
              count
            }
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map((user, index) => ({
            rank: index + 1,
            user_id: user.user_id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            points: user.count * 10, // 10 points per poem
            metric_value: user.count,
            metric_type: "poems"
          }))

        leaderboardData.poems = poemLeaderboard
      }

      // Game scores leaderboard
      const { data: gameData, error: gameError } = await supabase
        .from("game_scores")
        .select(`
          user_id,
          score,
          profiles!game_scores_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .order("score", { ascending: false })
        .limit(50)

      if (!gameError && gameData) {
        const gameScores = gameData.reduce((acc, score) => {
          const userId = score.user_id
          if (!acc[userId]) {
            acc[userId] = {
              total_score: 0,
              games_played: 0,
              user_data: score.profiles
            }
          }
          acc[userId].total_score += score.score
          acc[userId].games_played += 1
          return acc
        }, {} as Record<string, any>)

        const gameLeaderboard = Object.entries(gameScores)
          .map(([userId, data]) => ({
            rank: 0, // Will be set below
            user_id: userId,
            username: data.user_data?.username || "Unknown",
            display_name: data.user_data?.display_name || "Unknown",
            avatar_url: data.user_data?.avatar_url,
            points: data.total_score,
            metric_value: data.total_score,
            metric_type: "games"
          }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }))

        leaderboardData.games = gameLeaderboard
      }

      // Gallery items leaderboard
      const { data: galleryData, error: galleryError } = await supabase
        .from("gallery_items")
        .select(`
          user_id,
          likes_count,
          profiles!gallery_items_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)

      if (!galleryError && galleryData) {
        const galleryStats = galleryData.reduce((acc, item) => {
          const userId = item.user_id
          if (!acc[userId]) {
            acc[userId] = {
              total_likes: 0,
              items_count: 0,
              user_data: item.profiles
            }
          }
          acc[userId].total_likes += item.likes_count
          acc[userId].items_count += 1
          return acc
        }, {} as Record<string, any>)

        const galleryLeaderboard = Object.entries(galleryStats)
          .map(([userId, data]) => ({
            rank: 0,
            user_id: userId,
            username: data.user_data?.username || "Unknown",
            display_name: data.user_data?.display_name || "Unknown",
            avatar_url: data.user_data?.avatar_url,
            points: data.total_likes,
            metric_value: data.total_likes,
            metric_type: "gallery"
          }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }))

        leaderboardData.gallery = galleryLeaderboard
      }

      setLeaderboards(leaderboardData)
    } catch (error) {
      console.error("Error fetching leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true })

      const { data: pointsData } = await supabase
        .from("profiles")
        .select("points")
        .order("points", { ascending: false })

      const totalPoints = pointsData?.reduce((sum, user) => sum + user.points, 0) || 0
      const averagePoints = totalUsers ? Math.round(totalPoints / totalUsers) : 0
      const topPerformer = pointsData?.[0]?.points || 0

      setCategoryStats({
        total_users: totalUsers || 0,
        total_points: totalPoints,
        average_points: averagePoints,
        top_performer: topPerformer.toString()
      })
    } catch (error) {
      console.error("Error fetching category stats:", error)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />
      case 2: return <Medal className="h-6 w-6 text-gray-400" />
      case 3: return <Medal className="h-6 w-6 text-amber-600" />
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-100 border-yellow-300"
      case 2: return "bg-gray-100 border-gray-300"
      case 3: return "bg-amber-100 border-amber-300"
      default: return "bg-muted/30 border-border"
    }
  }

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case "points": return <Star className="h-4 w-4" />
      case "poems": return <BookOpen className="h-4 w-4" />
      case "games": return <Gamepad2 className="h-4 w-4" />
      case "gallery": return <Image className="h-4 w-4" />
      default: return <TrendingUp className="h-4 w-4" />
    }
  }

  const formatMetricValue = (value: number, metricType: string) => {
    switch (metricType) {
      case "points": return `${value.toLocaleString()} pts`
      case "poems": return `${value} poems`
      case "games": return `${value.toLocaleString()} pts`
      case "gallery": return `${value} likes`
      default: return value.toString()
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Leaderboard</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Celebrate the top performers and most active members of our community
            </p>
          </motion.div>

          {/* Category Stats */}
          {categoryStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{categoryStats.total_users}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{categoryStats.total_points.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{categoryStats.average_points}</div>
                  <div className="text-sm text-muted-foreground">Avg Points</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Crown className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{categoryStats.top_performer}</div>
                  <div className="text-sm text-muted-foreground">Top Score</div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overall">
                <Trophy className="h-4 w-4 mr-2" />
                Overall
              </TabsTrigger>
              <TabsTrigger value="poems">
                <BookOpen className="h-4 w-4 mr-2" />
                Poems
              </TabsTrigger>
              <TabsTrigger value="games">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Games
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <Image className="h-4 w-4 mr-2" />
                Gallery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-muted rounded"></div>
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-4 bg-muted rounded w-1/6"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  leaderboards.overall?.map((entry, index) => (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className={`${getRankColor(entry.rank)} border-2`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-8 h-8">
                                {getRankIcon(entry.rank)}
                              </div>
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                {entry.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{entry.display_name}</div>
                                <div className="text-sm text-muted-foreground">@{entry.username}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-foreground">
                                  {formatMetricValue(entry.metric_value, entry.metric_type)}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  {getMetricIcon(entry.metric_type)}
                                  <span className="ml-1">Total Points</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="poems" className="space-y-6">
              <div className="space-y-4">
                {leaderboards.poems?.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className={`${getRankColor(entry.rank)} border-2`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankIcon(entry.rank)}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {entry.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{entry.display_name}</div>
                              <div className="text-sm text-muted-foreground">@{entry.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-foreground">
                                {formatMetricValue(entry.metric_value, entry.metric_type)}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                {getMetricIcon(entry.metric_type)}
                                <span className="ml-1">Poems Written</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <div className="space-y-4">
                {leaderboards.games?.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className={`${getRankColor(entry.rank)} border-2`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankIcon(entry.rank)}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {entry.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{entry.display_name}</div>
                              <div className="text-sm text-muted-foreground">@{entry.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-foreground">
                                {formatMetricValue(entry.metric_value, entry.metric_type)}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                {getMetricIcon(entry.metric_type)}
                                <span className="ml-1">Game Score</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <div className="space-y-4">
                {leaderboards.gallery?.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className={`${getRankColor(entry.rank)} border-2`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankIcon(entry.rank)}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {entry.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{entry.display_name}</div>
                              <div className="text-sm text-muted-foreground">@{entry.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-foreground">
                                {formatMetricValue(entry.metric_value, entry.metric_type)}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                {getMetricIcon(entry.metric_type)}
                                <span className="ml-1">Gallery Likes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}