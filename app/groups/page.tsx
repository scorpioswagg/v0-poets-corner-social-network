import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Plus, Heart, BookOpen, Mic, Globe } from "lucide-react"

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all public groups
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, description, theme, member_count, created_at")
    .eq("is_public", true)
    .order("member_count", { ascending: false })

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "romantic":
        return <Heart className="h-5 w-5 text-red-500" />
      case "slam":
        return <Mic className="h-5 w-5 text-orange-500" />
      case "political":
        return <Globe className="h-5 w-5 text-blue-500" />
      default:
        return <BookOpen className="h-5 w-5 text-primary" />
    }
  }

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case "romantic":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
      case "slam":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
      case "political":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
      case "experimental":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
      default:
        return "bg-primary/10 text-primary border-primary/20"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Community Groups</h1>
              <p className="text-muted-foreground">Find your tribe and connect with like-minded writers</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>

          {groups && groups.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getThemeIcon(group.theme)}
                        <div>
                          <CardTitle className="font-serif">{group.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{group.member_count} members</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getThemeColor(group.theme)}>{group.theme}</Badge>
                    </div>
                    {group.description && (
                      <CardDescription className="text-pretty">{group.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Created {new Date(group.created_at).toLocaleDateString()}
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/groups/${group.id}`}>Join Group</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to create a community group!</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Group
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
