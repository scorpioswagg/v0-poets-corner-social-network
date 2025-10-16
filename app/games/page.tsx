
"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Gamepad2, 
  Trophy, 
  Clock, 
  Star, 
  Zap, 
  Brain, 
  Target, 
  Users, 
  TrendingUp,
  Award,
  Play,
  BarChart3
} from "lucide-react"

interface Game {
  id: string
  name: string
  description: string
  game_type: string
  difficulty: string
  is_active: boolean
}

interface GameScore {
  id: string
  score: number
  time_taken: number
  created_at: string
  game: {
    name: string
    game_type: string
  }
}

interface UserStats {
  total_games_played: number
  total_score: number
  average_score: number
  best_score: number
  games_this_week: number
}

export default function GamesPage() {
  const [user, setUser] = useState<any>(null)
  const [games, setGames] = useState<Game[]>([])
  const [recentScores, setRecentScores] = useState<GameScore[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
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
      fetchGames()
      fetchUserStats()
      fetchRecentScores()
    }
  }, [user])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error("Error fetching games:", error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from("game_scores")
        .select(`
          score,
          created_at,
          games!inner(name, game_type)
        `)
        .eq("user_id", user.id)

      if (error) throw error

      const scores = data || []
      const totalGames = scores.length
      const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
      const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0
      const bestScore = Math.max(...scores.map(s => s.score), 0)
      
      // Count games this week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const gamesThisWeek = scores.filter(score => 
        new Date(score.created_at) >= oneWeekAgo
      ).length

      setUserStats({
        total_games_played: totalGames,
        total_score: totalScore,
        average_score: averageScore,
        best_score: bestScore,
        games_this_week: gamesThisWeek
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const fetchRecentScores = async () => {
    try {
      const { data, error } = await supabase
        .from("game_scores")
        .select(`
          id,
          score,
          time_taken,
          created_at,
          games!inner(name, game_type)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentScores(data || [])
    } catch (error) {
      console.error("Error fetching recent scores:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'hangman': return <Target className="h-8 w-8" />
      case 'verse_builder': return <Zap className="h-8 w-8" />
      case 'trivia': return <Brain className="h-8 w-8" />
      case 'rhyme_race': return <Clock className="h-8 w-8" />
      default: return <Gamepad2 className="h-8 w-8" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground mb-6">
              Fun & Games
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Challenge yourself with poetic games, build your skills, and compete with fellow writers!
            </p>
          </motion.div>

          <Tabs defaultValue="games" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="games">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Games
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                My Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games" className="space-y-8">
              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getGameIcon(game.game_type)}
                          </div>
                          <Badge className={getDifficultyColor(game.difficulty)}>
                            {game.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="font-serif text-xl">{game.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {game.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button asChild className="w-full group-hover:bg-primary/90">
                          <Link href={`/games/${game.game_type}`}>
                            <Play className="h-4 w-4 mr-2" />
                            Play Now
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    Top Players This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((rank) => (
                      <div key={rank} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {rank}
                          </div>
                          <div>
                            <div className="font-medium">Player {rank}</div>
                            <div className="text-sm text-muted-foreground">1,{rank * 250} points</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{5 - rank + 1} games</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {userStats && (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {userStats.total_games_played}
                        </div>
                        <div className="text-sm text-muted-foreground">Games Played</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {userStats.total_score.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Score</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {userStats.average_score}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {userStats.best_score}
                        </div>
                        <div className="text-sm text-muted-foreground">Best Score</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Progress</CardTitle>
                      <CardDescription>
                        You've played {userStats.games_this_week} games this week
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Games this week</span>
                          <span>{userStats.games_this_week}/10</span>
                        </div>
                        <Progress value={(userStats.games_this_week / 10) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Games</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentScores.length > 0 ? (
                        <div className="space-y-3">
                          {recentScores.map((score) => (
                            <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div>
                                <div className="font-medium">{score.game.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(score.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-primary">{score.score} pts</div>
                                {score.time_taken && (
                                  <div className="text-sm text-muted-foreground">
                                    {Math.round(score.time_taken / 60)}m
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No games played yet. Start playing to see your scores here!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
