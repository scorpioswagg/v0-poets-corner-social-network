"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Save, Eye, Send, X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const GENRES = [
  "poetry",
  "haiku",
  "sonnet",
  "free-verse",
  "slam",
  "romantic",
  "political",
  "experimental",
  "narrative",
  "lyrical",
  "prose-poetry",
  "micro-fiction",
  "essay",
  "short-story",
]

const COMMON_TAGS = [
  "love",
  "nature",
  "life",
  "death",
  "hope",
  "dreams",
  "memories",
  "family",
  "friendship",
  "loss",
  "joy",
  "pain",
  "growth",
  "change",
  "time",
  "seasons",
  "urban",
  "rural",
  "spiritual",
  "philosophical",
]

export default function WritePage() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [genre, setGenre] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [postId, setPostId] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()
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

  // Auto-save functionality
  useEffect(() => {
    if (!user || !title.trim() || !content.trim()) return

    const autoSave = setTimeout(() => {
      handleSaveDraft(true)
    }, 5000) // Auto-save every 5 seconds

    return () => clearTimeout(autoSave)
  }, [title, content, excerpt, genre, tags, user])

  const generateExcerpt = (text: string) => {
    const words = text.split(" ").slice(0, 30)
    return words.join(" ") + (text.split(" ").length > 30 ? "..." : "")
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSaveDraft = async (isAutoSave = false) => {
    if (!user || !title.trim() || !content.trim()) return

    setIsSaving(true)

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || generateExcerpt(content),
        genre: genre || null,
        tags: tags.length > 0 ? tags : null,
        is_published: false,
        is_draft: true,
        author_id: user.id,
      }

      let result
      if (postId) {
        // Update existing draft
        result = await supabase.from("posts").update(postData).eq("id", postId).select().single()
      } else {
        // Create new draft
        result = await supabase.from("posts").insert(postData).select().single()
        if (result.data) {
          setPostId(result.data.id)
        }
      }

      if (result.error) throw result.error

      setLastSaved(new Date())
      if (!isAutoSave) {
        toast({
          title: "Draft saved",
          description: "Your work has been saved as a draft.",
        })
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      if (!isAutoSave) {
        toast({
          title: "Error saving draft",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please add a title and content before publishing.",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || generateExcerpt(content),
        genre: genre || null,
        tags: tags.length > 0 ? tags : null,
        is_published: true,
        is_draft: false,
        author_id: user.id,
      }

      let result
      if (postId) {
        // Update existing post
        result = await supabase.from("posts").update(postData).eq("id", postId).select().single()
      } else {
        // Create new post
        result = await supabase.from("posts").insert(postData).select().single()
      }

      if (result.error) throw result.error

      toast({
        title: "Published successfully!",
        description: "Your work is now live in The Poets Corner.",
      })

      router.push(`/post/${result.data.id}`)
    } catch (error) {
      console.error("Error publishing:", error)
      toast({
        title: "Error publishing",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = () => {
    // Store current work in localStorage for preview
    localStorage.setItem(
      "preview-post",
      JSON.stringify({
        title,
        content,
        excerpt: excerpt || generateExcerpt(content),
        genre,
        tags,
      }),
    )
    window.open("/preview", "_blank")
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
              <h1 className="text-3xl font-serif font-bold text-foreground">Write</h1>
              <p className="text-muted-foreground">Share your voice with the world</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
              {isSaving && <span>Saving...</span>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Your Work</CardTitle>
                  <CardDescription>Write your poem, story, or essay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter your title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Let your words flow..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[400px] font-mono text-base leading-relaxed resize-none"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {content.split(" ").filter(Boolean).length} words
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Brief description or first few lines..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="text-xs text-muted-foreground">
                      {excerpt ? `${excerpt.length}/200 characters` : "Auto-generated if left empty"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleSaveDraft()} disabled={isSaving} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button onClick={handlePreview} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={handlePublish} disabled={isPublishing || !title.trim() || !content.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Genre Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Genre</CardTitle>
                  <CardDescription>Categorize your work</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1).replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                  <CardDescription>Help readers discover your work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTag(newTag)
                        }
                      }}
                    />
                    <Button size="sm" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer">
                          {tag}
                          <X className="h-3 w-3 ml-1" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-sm font-medium mb-2">Popular tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_TAGS.slice(0, 10).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => addTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Publishing</CardTitle>
                  <CardDescription>Control how your work is shared</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Draft Mode</Label>
                      <p className="text-xs text-muted-foreground">Keep as private draft</p>
                    </div>
                    <Switch checked={isDraft} onCheckedChange={setIsDraft} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Published</Label>
                      <p className="text-xs text-muted-foreground">Make visible to community</p>
                    </div>
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} disabled />
                  </div>
                </CardContent>
              </Card>

              {/* Writing Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Writing Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Use line breaks to create rhythm in poetry</p>
                  <p>• Add tags to help readers find your work</p>
                  <p>• Write a compelling excerpt to draw readers in</p>
                  <p>• Save drafts frequently while working</p>
                  <p>• Preview before publishing to check formatting</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
