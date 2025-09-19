"use client"

import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState } from "react"
import { Heart, MessageCircle, Share, Bookmark, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface PostViewProps {
  post: {
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
      bio?: string
    }
    user_has_liked: boolean
  }
}

export function PostView({ post: initialPost }: PostViewProps) {
  const [post, setPost] = useState(initialPost)
  const { toast } = useToast()
  const supabase = createClient()

  const handleLike = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (post.user_has_liked) {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      } else {
        await supabase.from("likes").insert({ post_id: post.id, user_id: user.id })
      }

      setPost({
        ...post,
        likes_count: post.user_has_liked ? post.likes_count - 1 : post.likes_count + 1,
        user_has_liked: !post.user_has_liked,
      })
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard.",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} alt={post.author.display_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {post.author.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {post.author.display_name}
              </Link>
              <span className="text-muted-foreground">@{post.author.username}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            {post.author.bio && <p className="text-sm text-muted-foreground mt-2">{post.author.bio}</p>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4 text-balance">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mb-6 text-pretty">{post.excerpt}</p>}
        </div>

        {(post.genre || (post.tags && post.tags.length > 0)) && (
          <div className="flex flex-wrap gap-2">
            {post.genre && <Badge variant="outline">{post.genre.replace("-", " ")}</Badge>}
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-foreground">{post.content}</div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn("gap-2 text-base", post.user_has_liked && "text-red-500 hover:text-red-600")}
            >
              <Heart className={cn("h-5 w-5", post.user_has_liked && "fill-current")} />
              {post.likes_count}
            </Button>

            <Button variant="ghost" size="sm" asChild className="gap-2 text-base">
              <Link href="#comments">
                <MessageCircle className="h-5 w-5" />
                {post.comments_count}
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 text-base">
              <Share className="h-5 w-5" />
              Share
            </Button>
          </div>

          <Button variant="ghost" size="sm">
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
