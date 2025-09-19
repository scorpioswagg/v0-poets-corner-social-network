"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ArrowLeft, Heart, MessageCircle, Share } from "lucide-react"

interface PreviewPost {
  title: string
  content: string
  excerpt: string
  genre: string
  tags: string[]
}

export default function PreviewPage() {
  const [post, setPost] = useState<PreviewPost | null>(null)

  useEffect(() => {
    const previewData = localStorage.getItem("preview-post")
    if (previewData) {
      setPost(JSON.parse(previewData))
    }
  }, [])

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground">No preview data found.</p>
            <Button onClick={() => window.close()} className="mt-4">
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => window.close()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Close Preview
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Preview Mode</h1>
              <p className="text-sm text-muted-foreground">This is how your post will appear to readers</p>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-serif mb-4 text-balance">{post.title}</CardTitle>
                  {post.excerpt && <p className="text-lg text-muted-foreground text-pretty mb-4">{post.excerpt}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>By You</span>
                    <span>•</span>
                    <span>Just now</span>
                  </div>
                </div>
              </div>

              {(post.genre || post.tags.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.genre && <Badge variant="outline">{post.genre.replace("-", " ")}</Badge>}
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-foreground">
                  {post.content}
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="flex items-center gap-6">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• This is how your post will appear once published</p>
              <p>• Interaction buttons (like, comment, share) will be functional after publishing</p>
              <p>• Your profile information will appear instead of "By You"</p>
              <p>• The timestamp will show the actual publication time</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
