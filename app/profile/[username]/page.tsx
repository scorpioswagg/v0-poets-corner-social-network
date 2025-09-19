import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPin, Calendar, Award, Heart, MessageCircle, BookOpen } from "lucide-react"

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get the profile data
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", username).single()

  if (error || !profile) {
    notFound()
  }

  // Get user's posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, excerpt, created_at, likes_count, comments_count, tags, genre")
    .eq("author_id", profile.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get current user to check if this is their profile
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.display_name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-serif font-bold text-foreground">{profile.display_name}</h1>
                      <p className="text-lg text-muted-foreground">@{profile.username}</p>
                      {profile.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </div>
                      )}
                    </div>

                    {isOwnProfile && (
                      <Button asChild>
                        <Link href="/settings">Edit Profile</Link>
                      </Button>
                    )}
                  </div>

                  {profile.bio && <p className="text-foreground mt-4 text-pretty">{profile.bio}</p>}

                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-medium">{profile.points}</span>
                      <span className="text-muted-foreground">points</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Joined {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {profile.favorite_genres && profile.favorite_genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {profile.favorite_genres.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {profile.badges && profile.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {profile.badges.map((badge) => (
                        <Badge key={badge} className="bg-primary/10 text-primary border-primary/20">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-serif">
                            <Link
                              href={`/post/${post.id}`}
                              className="hover:text-primary transition-colors text-balance"
                            >
                              {post.title}
                            </Link>
                          </CardTitle>
                          {post.excerpt && (
                            <CardDescription className="mt-2 text-pretty">{post.excerpt}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments_count}
                          </div>
                        </div>
                        <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString()}</time>
                      </div>
                      {(post.tags || post.genre) && (
                        <div className="flex flex-wrap gap-2">
                          {post.genre && <Badge variant="outline">{post.genre}</Badge>}
                          {post.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "You haven't published any posts yet." : "No posts published yet."}
                    </p>
                    {isOwnProfile && (
                      <Button asChild className="mt-4">
                        <Link href="/write">Write Your First Post</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Favorites will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Recent activity will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
