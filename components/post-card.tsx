"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ReportDialog } from "@/components/report-dialog"
import { BlockUserDialog } from "@/components/block-user-dialog"
import Link from "next/link"
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Flag, UserX } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostCardProps {
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
    }
    user_has_liked: boolean
  }
  onLike: (postId: string, isLiked: boolean) => void
  currentUserId?: string
}

export function PostCard({ post, onLike, currentUserId }: PostCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getContentPreview = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const isOwnPost = currentUserId === post.author.username // Note: This should be compared with author ID, not username

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} alt={post.author.display_name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {post.author.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {post.author.display_name}
              </Link>
              <span className="text-muted-foreground">@{post.author.username}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground text-sm">{formatDate(post.created_at)}</span>
            </div>
          </div>
          {!isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ReportDialog contentType="post" contentId={post.id} reportedUserId={post.author.username}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                </ReportDialog>
                <DropdownMenuSeparator />
                <BlockUserDialog
                  userId={post.author.username}
                  username={post.author.username}
                  displayName={post.author.display_name}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserX className="h-4 w-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                </BlockUserDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Link href={`/post/${post.id}`} className="group">
            <h2 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors mb-2 text-balance">
              {post.title}
            </h2>
          </Link>

          {post.excerpt && <p className="text-muted-foreground text-pretty mb-3">{post.excerpt}</p>}

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">{getContentPreview(post.content)}</div>
          </div>

          <Link
            href={`/post/${post.id}`}
            className="text-primary hover:text-primary/80 text-sm font-medium inline-block mt-2"
          >
            Read more →
          </Link>
        </div>

        {(post.genre || (post.tags && post.tags.length > 0)) && (
          <div className="flex flex-wrap gap-2">
            {post.genre && <Badge variant="outline">{post.genre.replace("-", " ")}</Badge>}
            {post.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {post.tags && post.tags.length > 3 && <Badge variant="secondary">+{post.tags.length - 3} more</Badge>}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id, post.user_has_liked)}
              className={cn("gap-2", post.user_has_liked && "text-red-500 hover:text-red-600")}
            >
              <Heart className={cn("h-4 w-4", post.user_has_liked && "fill-current")} />
              {post.likes_count}
            </Button>

            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href={`/post/${post.id}#comments`}>
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>

          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
