import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { PostView } from "@/components/post-view"
import { CommentSection } from "@/components/comment-section"
import { notFound } from "next/navigation"

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get the post with author information
  const { data: post, error } = await supabase
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
      author_id,
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url,
        bio
      )
    `,
    )
    .eq("id", id)
    .eq("is_published", true)
    .single()

  if (error || !post) {
    notFound()
  }

  // Get current user to check if they've liked the post
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userHasLiked = false
  if (user) {
    const { data: like } = await supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).single()
    userHasLiked = !!like
  }

  // Get comments
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      parent_id,
      profiles!comments_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true })

  const postWithAuthor = {
    ...post,
    author: post.profiles,
    user_has_liked: userHasLiked,
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <PostView post={postWithAuthor} />
          <CommentSection postId={id} comments={comments || []} currentUser={user} />
        </div>
      </div>
    </div>
  )
}
