"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Lightbulb, 
  Calendar, 
  Star, 
  Clock, 
  TrendingUp, 
  Heart,
  MessageCircle,
  Edit,
  Filter,
  SortAsc,
  Plus
} from "lucide-react"

interface Prompt {
  id: string
  title: string
  description: string
  prompt_type: string
  category: string
  difficulty: string
  is_active: boolean
  featured: boolean
  created_at: string
  created_by?: {
    username: string
    display_name: string
  }
}

interface PromptResponse {
  id: string
  content: string
  title: string
  is_public: boolean
  likes_count: number
  comments_count: number
  created_at: string
  user: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

export default function PromptsPage() {
  const [user, setUser] = useState<any>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [responses, setResponses] = useState<PromptResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("daily")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [responseTitle, setResponseTitle] = useState("")
  const [responseContent, setResponseContent] = useState("")
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
      fetchPrompts()
      fetchResponses()
    }
  }, [user, activeTab, sortBy, filterBy])

  const fetchPrompts = async () => {
    try {
      let query = supabase
        .from("prompts")
        .select(`
          id,
          title,
          description,
          prompt_type,
          category,
          difficulty,
          is_active,
          featured,
          created_at,
          profiles!prompts_created_by_fkey (
            username,
            display_name
          )
        `)
        .eq("is_active", true)

      // Filter by prompt type
      if (activeTab !== "all") {
        query = query.eq("prompt_type", activeTab)
      }

      // Filter by category
      if (filterBy !== "all") {
        query = query.eq("category", filterBy)
      }

      // Sort
      switch (sortBy) {
        case "featured":
          query = query.order("featured", { ascending: false }).order("created_at", { ascending: false })
          break
        case "difficulty":
          query = query.order("difficulty", { ascending: true }).order("created_at", { ascending: false })
          break
        case "recent":
        default:
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data, error } = await query.limit(20)

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error("Error fetching prompts:", error)
    }
  }

  const fetchResponses = async () => {
    try {
      let query = supabase
        .from("prompt_responses")
        .select(`
          id,
          content,
          title,
          is_public,
          likes_count,
          comments_count,
          created_at,
          profiles!prompt_responses_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)

      // Sort responses
      switch (sortBy) {
        case "popular":
          query = query.order("likes_count", { ascending: false })
          break
        case "discussed":
          query = query.order("comments_count", { ascending: false })
          break
        case "recent":
        default:
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data, error } = await query.limit(20)

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error("Error fetching responses:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitResponse = async () => {
    if (!selectedPrompt || !responseContent.trim()) return

    try {
      const { error } = await supabase
        .from("prompt_responses")
        .insert({
          prompt_id: selectedPrompt.id,
          user_id: user.id,
          title: responseTitle || "Untitled Response",
          content: responseContent,
          is_public: true
        })

      if (error) throw error

      // Reset form
      setResponseTitle("")
      setResponseContent("")
      setShowResponseForm(false)
      setSelectedPrompt(null)

      // Refresh responses
      fetchResponses()
    } catch (error) {
      console.error("Error submitting response:", error)
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'poetry': return 'bg-purple-100 text-purple-800'
      case 'fiction': return 'bg-blue-100 text-blue-800'
      case 'non-fiction': return 'bg-green-100 text-green-800'
      case 'creative': return 'bg-orange-100 text-orange-800'
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Writing Prompts</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Spark your creativity with daily prompts, challenges, and community responses
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="daily">
                <Calendar className="h-4 w-4 mr-2" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <Clock className="h-4 w-4 mr-2" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="random">
                <Star className="h-4 w-4 mr-2" />
                Random
              </TabsTrigger>
              <TabsTrigger value="responses">
                <TrendingUp className="h-4 w-4 mr-2" />
                Community
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Recent
                  </Button>
                  <Button
                    variant={sortBy === "featured" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("featured")}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Featured
                  </Button>
                  <Button
                    variant={sortBy === "difficulty" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("difficulty")}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Difficulty
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterBy === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterBy === "poetry" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("poetry")}
                  >
                    Poetry
                  </Button>
                  <Button
                    variant={filterBy === "fiction" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("fiction")}
                  >
                    Fiction
                  </Button>
                </div>
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
                  {prompts.map((prompt, index) => (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="font-serif text-xl">{prompt.title}</CardTitle>
                                {prompt.featured && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-base">
                                {prompt.description}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Badge className={getDifficultyColor(prompt.difficulty)}>
                                {prompt.difficulty}
                              </Badge>
                              <Badge className={getCategoryColor(prompt.category)}>
                                {prompt.category}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {prompt.created_by ? (
                                <span>by @{prompt.created_by.username}</span>
                              ) : (
                                <span>Community prompt</span>
                              )}
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedPrompt(prompt)
                                setShowResponseForm(true)
                              }}
                              className="group-hover:bg-primary/90"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6">
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Weekly Challenges</h3>
                <p className="text-muted-foreground mb-4">
                  New weekly challenges coming soon!
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="random" className="space-y-6">
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Random Prompts</h3>
                <p className="text-muted-foreground mb-4">
                  Get a random prompt to spark your creativity!
                </p>
                <Button>
                  <Star className="h-4 w-4 mr-2" />
                  Get Random Prompt
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="responses" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Recent
                  </Button>
                  <Button
                    variant={sortBy === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("popular")}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Popular
                  </Button>
                  <Button
                    variant={sortBy === "discussed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("discussed")}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Discussed
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {responses.map((response, index) => (
                  <motion.div
                    key={response.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="font-serif text-lg">{response.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-muted-foreground">
                                by @{response.user.username}
                              </span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(response.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {response.likes_count}
                            </Badge>
                            <Badge variant="outline" className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {response.comments_count}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{response.content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Response Form Modal */}
          {showResponseForm && selectedPrompt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Respond to: {selectedPrompt.title}</CardTitle>
                  <CardDescription>{selectedPrompt.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title (optional)</label>
                    <Input
                      value={responseTitle}
                      onChange={(e) => setResponseTitle(e.target.value)}
                      placeholder="Give your response a title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Response</label>
                    <Textarea
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      placeholder="Write your response here..."
                      rows={8}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResponseForm(false)
                        setSelectedPrompt(null)
                        setResponseTitle("")
                        setResponseContent("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={submitResponse} disabled={!responseContent.trim()}>
                      Submit Response
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