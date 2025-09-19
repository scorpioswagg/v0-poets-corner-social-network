import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Flag, AlertTriangle, Users, FileText, MessageCircle, Shield } from "lucide-react"

export default async function ModerationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin/moderator
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/")
  }

  // Get pending reports
  const { data: pendingReports } = await supabase
    .from("reports")
    .select(
      `
      id,
      content_type,
      content_id,
      reason,
      description,
      created_at,
      status,
      profiles!reports_reporter_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      reported_profiles:profiles!reports_reported_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20)

  // Get recent moderation actions
  const { data: recentActions } = await supabase
    .from("moderation_actions")
    .select(
      `
      id,
      action_type,
      reason,
      created_at,
      profiles!moderation_actions_moderator_id_fkey (
        username,
        display_name
      ),
      target_profiles:profiles!moderation_actions_target_user_id_fkey (
        username,
        display_name
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10)

  // Get stats
  const { data: stats } = await supabase.rpc("get_moderation_stats").single()

  const getReasonBadge = (reason: string) => {
    const colors = {
      spam: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      harassment: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "hate-speech": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      inappropriate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      violence: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      copyright: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return colors[reason as keyof typeof colors] || colors.other
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4" />
      case "comment":
        return <MessageCircle className="h-4 w-4" />
      case "user":
        return <Users className="h-4 w-4" />
      default:
        return <Flag className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Moderation Dashboard</h1>
              <p className="text-muted-foreground">Keep The Poets Corner safe and welcoming</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.pending_reports || 0}</div>
                    <div className="text-sm text-muted-foreground">Pending Reports</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.total_reports || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Reports</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.actions_today || 0}</div>
                    <div className="text-sm text-muted-foreground">Actions Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reports">
                <Flag className="h-4 w-4 mr-2" />
                Pending Reports
              </TabsTrigger>
              <TabsTrigger value="actions">
                <Shield className="h-4 w-4 mr-2" />
                Recent Actions
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-4">
              {pendingReports && pendingReports.length > 0 ? (
                pendingReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            {getContentTypeIcon(report.content_type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Report #{report.id.slice(0, 8)}
                              <Badge className={getReasonBadge(report.reason)}>{report.reason.replace("-", " ")}</Badge>
                            </CardTitle>
                            <CardDescription>
                              {report.content_type} reported by @{report.profiles.username} •{" "}
                              {new Date(report.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={report.profiles.avatar_url || "/placeholder.svg"}
                            alt={report.profiles.display_name}
                          />
                          <AvatarFallback className="text-sm">
                            {report.profiles.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Reported by {report.profiles.display_name}</div>
                          <div className="text-sm text-muted-foreground">@{report.profiles.username}</div>
                        </div>
                      </div>

                      {report.reported_profiles && (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={report.reported_profiles.avatar_url || "/placeholder.svg"}
                              alt={report.reported_profiles.display_name}
                            />
                            <AvatarFallback className="text-sm">
                              {report.reported_profiles.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Reported user: {report.reported_profiles.display_name}</div>
                            <div className="text-sm text-muted-foreground">@{report.reported_profiles.username}</div>
                          </div>
                        </div>
                      )}

                      {report.description && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{report.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/admin/moderation/report/${report.id}`}>Review</Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          Dismiss
                        </Button>
                        <Button size="sm" variant="destructive">
                          Take Action
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No pending reports</h3>
                    <p className="text-muted-foreground">All reports have been reviewed. Great job!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {recentActions && recentActions.length > 0 ? (
                recentActions.map((action) => (
                  <Card key={action.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">
                              {action.action_type.replace("_", " ")} by @{action.profiles.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Target: @{action.target_profiles?.username} • {action.reason}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(action.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent moderation actions.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">User management tools coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
