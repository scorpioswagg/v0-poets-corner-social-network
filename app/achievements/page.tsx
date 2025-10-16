"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Award, 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Crown,
  Flame,
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  Gamepad2,
  MessageCircle,
  Image,
  Swords
} from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  is_active: boolean
  user_has_earned?: boolean
  earned_at?: string
  progress?: number
  max_progress?: number
}

interface UserStreak {
  id: string
  streak_type: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
}

interface UserStats {
  total_points: number
  total_achievements: number
  current_level: number
  points_to_next_level: number
  level_progress: number
}

export default function AchievementsPage() {
  const [user, setUser] = useState<any>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
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
      fetchAchievements()
      fetchUserStreaks()
      fetchUserStats()
    }
  }, [user, activeTab])

  const fetchAchievements = async () => {
    try {
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("points", { ascending: false })

      if (achievementsError) throw achievementsError

      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user.id)

      if (userAchievementsError) throw userAchievementsError

      const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])
      const earnedAchievementMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || [])

      // Calculate progress for each achievement
      const achievementsWithProgress = await Promise.all(
        (allAchievements || []).map(async (achievement) => {
          let progress = 0
          let maxProgress = 1

          // Calculate progress based on achievement type
          switch (achievement.name) {
            case 'First Steps':
              const { count: poemsCount } = await supabase
                .from("posts")
                .select("*", { count: 'exact', head: true })
                .eq("author_id", user.id)
                .eq("is_published", true)
              progress = Math.min(poemsCount || 0, 1)
              maxProgress = 1
              break

            case 'Verse Master':
              const { count: poemsCount10 } = await supabase
                .from("posts")
                .select("*", { count: 'exact', head: true })
                .eq("author_id", user.id)
                .eq("is_published", true)
              progress = Math.min(poemsCount10 || 0, 10)
              maxProgress = 10
              break

            case 'Daily Writer':
              const { data: streakData } = await supabase
                .from("user_streaks")
                .select("current_streak")
                .eq("user_id", user.id)
                .eq("streak_type", "daily_writing")
                .single()
              progress = Math.min(streakData?.current_streak || 0, 7)
              maxProgress = 7
              break

            case 'Game Champ':
              const { count: gamesWon } = await supabase
                .from("game_scores")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .gte("score", 1000) // Assuming 1000+ is a win
              progress = Math.min(gamesWon || 0, 5)
              maxProgress = 5
              break

            case 'Social Butterfly':
              const { count: commentsCount } = await supabase
                .from("comments")
                .select("*", { count: 'exact', head: true })
                .eq("author_id", user.id)
              progress = Math.min(commentsCount || 0, 20)
              maxProgress = 20
              break

            case 'Gallery Curator':
              const { count: galleryCount } = await supabase
                .from("gallery_items")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .eq("is_public", true)
              progress = Math.min(galleryCount || 0, 5)
              maxProgress = 5
              break

            default:
              progress = earnedAchievementIds.has(achievement.id) ? 1 : 0
              maxProgress = 1
          }

          return {
            ...achievement,
            user_has_earned: earnedAchievementIds.has(achievement.id),
            earned_at: earnedAchievementMap.get(achievement.id),
            progress,
            max_progress: maxProgress
          }
        })
      )

      // Filter by category
      const filteredAchievements = activeTab === "all" 
        ? achievementsWithProgress
        : achievementsWithProgress.filter(achievement => achievement.category === activeTab)

      setAchievements(filteredAchievements)
    } catch (error) {
      console.error("Error fetching achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)

      if (error) throw error
      setUserStreaks(data || [])
    } catch (error) {
      console.error("Error fetching user streaks:", error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single()

      const { count: achievementsCount } = await supabase
        .from("user_achievements")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)

      const totalPoints = profile?.points || 0
      const totalAchievements = achievementsCount || 0
      const currentLevel = Math.floor(totalPoints / 100) + 1
      const pointsToNextLevel = 100 - (totalPoints % 100)
      const levelProgress = (totalPoints % 100) / 100 * 100

      setUserStats({
        total_points: totalPoints,
        total_achievements: totalAchievements,
        current_level: currentLevel,
        points_to_next_level: pointsToNextLevel,
        level_progress: levelProgress
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'writing': return <BookOpen className="h-4 w-4" />
      case 'social': return <Users className="h-4 w-4" />
      case 'games': return <Gamepad2 className="h-4 w-4" />
      case 'community': return <MessageCircle className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'writing': return 'bg-purple-100 text-purple-800'
      case 'social': return 'bg-blue-100 text-blue-800'
      case 'games': return 'bg-green-100 text-green-800'
      case 'community': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'daily_writing': return <BookOpen className="h-4 w-4" />
      case 'daily_login': return <Calendar className="h-4 w-4" />
      case 'weekly_participation': return <TrendingUp className="h-4 w-4" />
      default: return <Flame className="h-4 w-4" />
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
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Achievements</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your progress, earn badges, and celebrate your creative journey
            </p>
          </motion.div>

          {/* User Stats Overview */}
          {userStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    Level {userStats.current_level}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Level</div>
                  <Progress value={userStats.level_progress} className="mt-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {userStats.points_to_next_level} points to next level
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {userStats.total_points}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {userStats.total_achievements}
                  </div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {Math.round((userStats.total_achievements / achievements.length) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion</div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="all">
                <Award className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
              <TabsTrigger value="writing">
                <BookOpen className="h-4 w-4 mr-2" />
                Writing
              </TabsTrigger>
              <TabsTrigger value="social">
                <Users className="h-4 w-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="games">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Games
              </TabsTrigger>
              <TabsTrigger value="streaks">
                <Flame className="h-4 w-4 mr-2" />
                Streaks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className={`group hover:shadow-xl transition-all duration-300 ${
                      achievement.user_has_earned ? 'ring-2 ring-yellow-400 bg-yellow-50/50' : ''
                    }`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              achievement.user_has_earned ? 'bg-yellow-100' : 'bg-muted'
                            }`}>
                              <span className="text-2xl">{achievement.icon}</span>
                            </div>
                            <div>
                              <CardTitle className="font-serif text-lg">{achievement.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {achievement.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getCategoryColor(achievement.category)}>
                              {getCategoryIcon(achievement.category)}
                              <span className="ml-1 capitalize">{achievement.category}</span>
                            </Badge>
                            <Badge variant="outline" className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {achievement.points} pts
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {achievement.user_has_earned ? (
                          <div className="space-y-2">
                            <div className="flex items-center text-green-600 text-sm">
                              <Trophy className="h-4 w-4 mr-1" />
                              Earned {achievement.earned_at && new Date(achievement.earned_at).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.max_progress}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / achievement.max_progress) * 100} 
                              className="h-2" 
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="writing" className="space-y-6">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Writing Achievements</h3>
                <p className="text-muted-foreground">
                  Achievements for your writing journey
                </p>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Social Achievements</h3>
                <p className="text-muted-foreground">
                  Achievements for community engagement
                </p>
              </div>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <div className="text-center py-12">
                <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Game Achievements</h3>
                <p className="text-muted-foreground">
                  Achievements for gaming and challenges
                </p>
              </div>
            </TabsContent>

            <TabsContent value="streaks" className="space-y-6">
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold">Your Streaks</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {userStreaks.map((streak, index) => (
                    <motion.div
                      key={streak.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="flex items-center justify-center mb-4">
                            {getStreakIcon(streak.streak_type)}
                            <Flame className="h-6 w-6 text-orange-500 ml-2" />
                          </div>
                          <div className="text-2xl font-bold text-foreground mb-1">
                            {streak.current_streak}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Current Streak
                          </div>
                          <div className="text-lg font-medium text-foreground mb-1">
                            {streak.longest_streak}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Longest Streak
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground capitalize">
                            {streak.streak_type.replace('_', ' ')}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}