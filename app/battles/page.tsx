"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Swords, 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp, 
  Heart,
  MessageCircle,
  Plus,
  Target,
  Zap,
  Crown,
  Timer
} from "lucide-react"

interface Battle {
  id: string
  title: string
  theme?: string
  status: string
  votes_challenger: number
  votes_challenged: number
  created_at: string
  expires_at?: string
  challenger: {
    username: string
    display_name: string
    avatar_url?: string
  }
  challenged: {
    username: string
    display_name: string
    avatar_url?: string
  }
  challenger_poem?: {
    id: string
    title: string
    content: string
  }
  challenged_poem?: {
    id: string
    title: string
    content: string
  }
  user_has_voted?: boolean
  user_voted_for?: string
}

interface BattleStats {
  total_battles: number
  battles_won: number
  battles_lost: number
  total_votes_received: number
  win_rate: number
}

export default function BattlesPage() {
  const [user, setUser] = useState<any>(null)
  const [battles, setBattles] = useState<Battle[]>([])
  const [userStats, setUserStats] = useState<BattleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [showCreateBattle, setShowCreateBattle] = useState(false)
  const [battleTitle, setBattleTitle] = useState("")
  const [battleTheme, setBattleTheme] = useState("")
  const [challengedUsername, setChallengedUsername] = useState("")
  const [poemContent, setPoemContent] = useState("")
  const [poemTitle, setPoemTitle] = useState("")
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
      fetchBattles()
      fetchUserStats()
    }
  }, [user, activeTab])

  const fetchBattles = async () => {
    try {
      let query = supabase
        .from("poetry_battles")
        .select(`
          id,
          title,
          theme,
          status,
          votes_challenger,
          votes_challenged,
          created_at,
          expires_at,
          challenger:profiles!poetry_battles_challenger_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          challenged:profiles!poetry_battles_challenged_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          challenger_poem:posts!poetry_battles_challenger_poem_id_fkey (
            id,
            title,
            content
          ),
          challenged_poem:posts!poetry_battles_challenged_poem_id_fkey (
            id,
            title,
            content
          )
        `)

      // Filter by status
      if (activeTab === "active") {
        query = query.in("status", ["pending", "active"])
      } else if (activeTab === "completed") {
        query = query.eq("status", "completed")
      } else if (activeTab === "my-battles") {
        query = query.or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      }

      query = query.order("created_at", { ascending: false })

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Check if user has voted on each battle
      const battleIds = data?.map(battle => battle.id) || []
      const { data: votes } = await supabase
        .from("battle_votes")
        .select("battle_id, voted_for_id")
        .eq("voter_id", user.id)
        .in("battle_id", battleIds)

      const userVotes = new Map(votes?.map(vote => [vote.battle_id, vote.voted_for_id]) || [])

      const battlesWithVotes = data?.map(battle => ({
        ...battle,
        user_has_voted: userVotes.has(battle.id),
        user_voted_for: userVotes.get(battle.id)
      }))

      setBattles(battlesWithVotes || [])
    } catch (error) {
      console.error("Error fetching battles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const { data: battleData } = await supabase
        .from("poetry_battles")
        .select("challenger_id, challenged_id, winner_id")
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .eq("status", "completed")

      const { data: voteData } = await supabase
        .from("battle_votes")
        .select("battle_id")
        .eq("voter_id", user.id)

      const battles = battleData || []
      const totalBattles = battles.length
      const battlesWon = battles.filter(battle => battle.winner_id === user.id).length
      const battlesLost = totalBattles - battlesWon
      const totalVotesReceived = battles.reduce((sum, battle) => {
        if (battle.challenger_id === user.id) {
          return sum + (battle.votes_challenger || 0)
        } else {
          return sum + (battle.votes_challenged || 0)
        }
      }, 0)
      const winRate = totalBattles > 0 ? Math.round((battlesWon / totalBattles) * 100) : 0

      setUserStats({
        total_battles: totalBattles,
        battles_won: battlesWon,
        battles_lost: battlesLost,
        total_votes_received: totalVotesReceived,
        win_rate: winRate
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const createBattle = async () => {
    if (!battleTitle.trim() || !challengedUsername.trim() || !poemContent.trim()) return

    try {
      // First, find the challenged user
      const { data: challengedUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", challengedUsername)
        .single()

      if (!challengedUser) {
        alert("User not found")
        return
      }

      // Create the poem post
      const { data: poemData, error: poemError } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          title: poemTitle || "Battle Poem",
          content: poemContent,
          genre: "poetry",
          is_published: true,
          is_draft: false
        })
        .select("id")
        .single()

      if (poemError) throw poemError

      // Create the battle
      const { error: battleError } = await supabase
        .from("poetry_battles")
        .insert({
          challenger_id: user.id,
          challenged_id: challengedUser.id,
          title: battleTitle,
          theme: battleTheme || null,
          challenger_poem_id: poemData.id,
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })

      if (battleError) throw battleError

      // Reset form
      setBattleTitle("")
      setBattleTheme("")
      setChallengedUsername("")
      setPoemContent("")
      setPoemTitle("")
      setShowCreateBattle(false)

      // Refresh battles
      fetchBattles()
    } catch (error) {
      console.error("Error creating battle:", error)
    }
  }

  const voteForBattle = async (battleId: string, votedForId: string) => {
    try {
      await supabase
        .from("battle_votes")
        .insert({
          battle_id: battleId,
          voter_id: user.id,
          voted_for_id: votedForId
        })

      // Update battle vote counts
      const battle = battles.find(b => b.id === battleId)
      if (battle) {
        const isChallenger = votedForId === battle.challenger.id
        await supabase
          .from("poetry_battles")
          .update({
            votes_challenger: isChallenger ? battle.votes_challenger + 1 : battle.votes_challenger,
            votes_challenged: !isChallenger ? battle.votes_challenged + 1 : battle.votes_challenged
          })
          .eq("id", battleId)
      }

      // Refresh battles
      fetchBattles()
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
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
              <Swords className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Poetry Battle Arena</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Challenge fellow poets to epic duels and let the community decide the winner!
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="active">
                <Zap className="h-4 w-4 mr-2" />
                Active Battles
              </TabsTrigger>
              <TabsTrigger value="completed">
                <Trophy className="h-4 w-4 mr-2" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="my-battles">
                <Target className="h-4 w-4 mr-2" />
                My Battles
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Crown className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold">Active Battles</h2>
                <Button onClick={() => setShowCreateBattle(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Challenge Someone
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {battles.map((battle, index) => (
                    <motion.div
                      key={battle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-xl transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="font-serif text-xl">{battle.title}</CardTitle>
                              {battle.theme && (
                                <CardDescription className="mt-1">
                                  Theme: {battle.theme}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(battle.status)}>
                                {battle.status}
                              </Badge>
                              {battle.expires_at && (
                                <Badge variant="outline" className="flex items-center">
                                  <Timer className="h-3 w-3 mr-1" />
                                  {getTimeRemaining(battle.expires_at)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Challenger */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                  {battle.challenger.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{battle.challenger.display_name}</div>
                                  <div className="text-sm text-muted-foreground">@{battle.challenger.username}</div>
                                </div>
                              </div>
                              {battle.challenger_poem && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                  <div className="font-medium text-sm mb-2">{battle.challenger_poem.title}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-3">
                                    {battle.challenger_poem.content}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="flex items-center">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {battle.votes_challenger} votes
                                </Badge>
                                {!battle.user_has_voted && battle.status === 'active' && (
                                  <Button
                                    size="sm"
                                    onClick={() => voteForBattle(battle.id, battle.challenger.id)}
                                  >
                                    Vote
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Challenged */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                  {battle.challenged.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{battle.challenged.display_name}</div>
                                  <div className="text-sm text-muted-foreground">@{battle.challenged.username}</div>
                                </div>
                              </div>
                              {battle.challenged_poem && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                  <div className="font-medium text-sm mb-2">{battle.challenged_poem.title}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-3">
                                    {battle.challenged_poem.content}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="flex items-center">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {battle.votes_challenged} votes
                                </Badge>
                                {!battle.user_has_voted && battle.status === 'active' && (
                                  <Button
                                    size="sm"
                                    onClick={() => voteForBattle(battle.id, battle.challenged.id)}
                                  >
                                    Vote
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Vote Progress */}
                          <div className="mt-4">
                            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                              <span>{battle.challenger.display_name}</span>
                              <span>{battle.challenged.display_name}</span>
                            </div>
                            <Progress 
                              value={battle.votes_challenger + battle.votes_challenged > 0 
                                ? (battle.votes_challenger / (battle.votes_challenger + battle.votes_challenged)) * 100 
                                : 50
                              } 
                              className="h-2" 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Completed Battles</h3>
                <p className="text-muted-foreground">
                  View all completed poetry battles and their results.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="my-battles" className="space-y-6">
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">My Battles</h3>
                <p className="text-muted-foreground">
                  View all battles you've participated in.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <div className="text-center py-12">
                <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Battle Leaderboard</h3>
                <p className="text-muted-foreground">
                  Top poets in the battle arena.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Create Battle Modal */}
          {showCreateBattle && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Challenge a Poet</CardTitle>
                  <CardDescription>Create a new poetry battle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Battle Title</label>
                    <Input
                      value={battleTitle}
                      onChange={(e) => setBattleTitle(e.target.value)}
                      placeholder="Enter battle title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Theme (optional)</label>
                    <Input
                      value={battleTheme}
                      onChange={(e) => setBattleTheme(e.target.value)}
                      placeholder="e.g., Love, Nature, Dreams..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Challenge Username</label>
                    <Input
                      value={challengedUsername}
                      onChange={(e) => setChallengedUsername(e.target.value)}
                      placeholder="Enter username to challenge..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Poem Title</label>
                    <Input
                      value={poemTitle}
                      onChange={(e) => setPoemTitle(e.target.value)}
                      placeholder="Enter poem title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Poem</label>
                    <Textarea
                      value={poemContent}
                      onChange={(e) => setPoemContent(e.target.value)}
                      placeholder="Write your poem here..."
                      rows={8}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateBattle(false)
                        setBattleTitle("")
                        setBattleTheme("")
                        setChallengedUsername("")
                        setPoemContent("")
                        setPoemTitle("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createBattle} disabled={!battleTitle.trim() || !challengedUsername.trim() || !poemContent.trim()}>
                      Create Battle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}