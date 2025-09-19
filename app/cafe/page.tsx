"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BookOpen, TrendingUp, Clock, Heart } from "lucide-react"
import Link from "next/link"

interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  created_at: string
  likes_count: number
  comments_count: number
  tags: string[]
  genre: string
  author: {
    username: string
    display_name: string
    avatar_url?: string
  }
  user_has_liked: boolean
}

export default function CafePage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
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
      fetchPosts()
    }
  }, [user, sortBy, filterBy])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("posts")
        .select(
          `
          id,
          title,
          content,
          excerpt,
          created_at,
          likes_count,
          comments_count,
          tags,
          genre,
          profiles!posts_author_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `,
        )
        .eq("is_published", true)

      // Apply filters
      if (filterBy !== "all") {
        query = query.eq("genre", filterBy)
      }

      // Apply sorting
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

      // Check which posts the user has liked
      const postIds = data?.map((post) => post.id) || []
      const { data: likes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds)

      const likedPostIds = new Set(likes?.map((like) => like.post_id) || [])

      const postsWithLikes = data?.map((post) => ({
        ...post,
        author: post.profiles,
        user_has_liked: likedPostIds.has(post.id),
      }))

      setPosts(postsWithLikes || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id)
      } else {
        await supabase.from("likes").insert({ post_id: postId, user_id: user.id })
      }

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
                user_has_liked: !isLiked,
              }
            : post,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">The Café</h1>
              <p className="text-muted-foreground">Discover amazing poetry and stories from our community</p>
            </div>
            <Button asChild>
              <Link href="/write">Share Your Work</Link>
            </Button>
          </div>

          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">
                <BookOpen className="h-4 w-4 mr-2" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="following">
                <Heart className="h-4 w-4 mr-2" />
                Following
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">
                      <Clock className="h-4 w-4 mr-2 inline" />
                      Most Recent
                    </SelectItem>
                    <SelectItem value="popular">
                      <Heart className="h-4 w-4 mr-2 inline" />
                      Most Liked
                    </SelectItem>
                    <SelectItem value="discussed">
                      <TrendingUp className="h-4 w-4 mr-2 inline" />
                      Most Discussed
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="poetry">Poetry</SelectItem>
                    <SelectItem value="haiku">Haiku</SelectItem>
                    <SelectItem value="sonnet">Sonnet</SelectItem>
                    <SelectItem value="free-verse">Free Verse</SelectItem>
                    <SelectItem value="slam">Slam Poetry</SelectItem>
                    <SelectItem value="prose-poetry">Prose Poetry</SelectItem>
                    <SelectItem value="micro-fiction">Micro Fiction</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="short-story">Short Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Posts */}
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
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onLike={handleLike} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No posts found</h3>
                    <p className="text-muted-foreground mb-4">
                      {filterBy !== "all" ? "Try changing your filter settings." : "Be the first to share something!"}
                    </p>
                    <Button asChild>
                      <Link href="/write">Write Something</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trending">
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Trending posts will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="following">
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Posts from people you follow will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
