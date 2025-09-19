import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserX, ArrowLeft } from "lucide-react"

export default async function BlockedUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get blocked users
  const { data: blockedUsers } = await supabase
    .from("user_blocks")
    .select(
      `
      id,
      created_at,
      profiles!user_blocks_blocked_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Blocked Users</h1>
              <p className="text-muted-foreground">Manage users you've blocked</p>
            </div>
          </div>

          {blockedUsers && blockedUsers.length > 0 ? (
            <div className="space-y-4">
              {blockedUsers.map((block) => (
                <Card key={block.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={block.profiles.avatar_url || "/placeholder.svg"}
                            alt={block.profiles.display_name}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {block.profiles.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{block.profiles.display_name}</div>
                          <div className="text-sm text-muted-foreground">@{block.profiles.username}</div>
                          <div className="text-xs text-muted-foreground">
                            Blocked {new Date(block.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Unblock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No blocked users</h3>
                <p className="text-muted-foreground">You haven't blocked anyone yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
