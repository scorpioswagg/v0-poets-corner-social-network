import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Calendar, Edit } from "lucide-react"

export default async function DraftsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's drafts
  const { data: drafts } = await supabase
    .from("posts")
    .select("id, title, excerpt, content, created_at, updated_at, tags, genre")
    .eq("author_id", user.id)
    .eq("is_draft", true)
    .eq("is_published", false)
    .order("updated_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">My Drafts</h1>
              <p className="text-muted-foreground">Your works in progress</p>
            </div>
            <Button asChild>
              <Link href="/write">
                <Edit className="h-4 w-4 mr-2" />
                New Draft
              </Link>
            </Button>
          </div>

          {drafts && drafts.length > 0 ? (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-serif">
                          <Link
                            href={`/write?draft=${draft.id}`}
                            className="hover:text-primary transition-colors text-balance"
                          >
                            {draft.title || "Untitled Draft"}
                          </Link>
                        </CardTitle>
                        {draft.excerpt && (
                          <CardDescription className="mt-2 text-pretty">{draft.excerpt}</CardDescription>
                        )}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/write?draft=${draft.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last edited {new Date(draft.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {draft.content ? draft.content.split(" ").filter(Boolean).length : 0} words
                      </div>
                    </div>

                    {(draft.genre || (draft.tags && draft.tags.length > 0)) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {draft.genre && <Badge variant="outline">{draft.genre.replace("-", " ")}</Badge>}
                        {draft.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No drafts yet</h3>
                <p className="text-muted-foreground mb-4">Start writing to create your first draft.</p>
                <Button asChild>
                  <Link href="/write">
                    <Edit className="h-4 w-4 mr-2" />
                    Start Writing
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
