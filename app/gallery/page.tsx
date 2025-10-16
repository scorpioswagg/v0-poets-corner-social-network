"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Image, 
  Heart, 
  Eye, 
  MessageCircle, 
  Share2, 
  Plus,
  Filter,
  Search,
  Upload,
  Play,
  Music,
  FileText,
  Video,
  Tag,
  Calendar,
  User
} from "lucide-react"

interface GalleryItem {
  id: string
  title: string
  description?: string
  media_type: string
  media_url: string
  thumbnail_url?: string
  tags: string[]
  category: string
  is_public: boolean
  likes_count: number
  views_count: number
  created_at: string
  user: {
    username: string
    display_name: string
    avatar_url?: string
  }
  user_has_liked?: boolean
}

export default function GalleryPage() {
  const [user, setUser] = useState<any>(null)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadCategory, setUploadCategory] = useState("poetry")
  const [uploadTags, setUploadTags] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const router = useRouter()
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

  useEffect(() => {
    if (user) {
      fetchGalleryItems()
    }
  }, [user, activeTab, sortBy, filterBy, searchQuery])

  const fetchGalleryItems = async () => {
    try {
      let query = supabase
        .from("gallery_items")
        .select(`
          id,
          title,
          description,
          media_type,
          media_url,
          thumbnail_url,
          tags,
          category,
          is_public,
          likes_count,
          views_count,
          created_at,
          profiles!gallery_items_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)

      // Filter by media type
      if (activeTab !== "all") {
        query = query.eq("media_type", activeTab)
      }

      // Filter by category
      if (filterBy !== "all") {
        query = query.eq("category", filterBy)
      }

      // Search
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
      }

      // Sort
      switch (sortBy) {
        case "popular":
          query = query.order("likes_count", { ascending: false })
          break
        case "views":
          query = query.order("views_count", { ascending: false })
          break
        case "recent":
        default:
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Check which items the user has liked
      const itemIds = data?.map(item => item.id) || []
      const { data: likes } = await supabase
        .from("gallery_likes")
        .select("gallery_item_id")
        .eq("user_id", user.id)
        .in("gallery_item_id", itemIds)

      const likedItemIds = new Set(likes?.map(like => like.gallery_item_id) || [])

      const itemsWithLikes = data?.map(item => ({
        ...item,
        user_has_liked: likedItemIds.has(item.id)
      }))

      setGalleryItems(itemsWithLikes || [])
    } catch (error) {
      console.error("Error fetching gallery items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (itemId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from("gallery_likes")
          .delete()
          .eq("gallery_item_id", itemId)
          .eq("user_id", user.id)
      } else {
        await supabase
          .from("gallery_likes")
          .insert({
            gallery_item_id: itemId,
            user_id: user.id
          })
      }

      // Update local state
      setGalleryItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                likes_count: isLiked ? item.likes_count - 1 : item.likes_count + 1,
                user_has_liked: !isLiked
              }
            : item
        )
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return

    try {
      // Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, uploadFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName)

      // Save to database
      const { error: dbError } = await supabase
        .from("gallery_items")
        .insert({
          user_id: user.id,
          title: uploadTitle,
          description: uploadDescription || null,
          media_type: getMediaType(uploadFile.type),
          media_url: publicUrl,
          category: uploadCategory,
          tags: uploadTags.split(',').map(tag => tag.trim()).filter(Boolean),
          is_public: true
        })

      if (dbError) throw dbError

      // Reset form
      setUploadTitle("")
      setUploadDescription("")
      setUploadCategory("poetry")
      setUploadTags("")
      setUploadFile(null)
      setShowUploadForm(false)

      // Refresh gallery
      fetchGalleryItems()
    } catch (error) {
      console.error("Error uploading:", error)
    }
  }

  const getMediaType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'text'
  }

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'poetry': return 'bg-purple-100 text-purple-800'
      case 'art': return 'bg-blue-100 text-blue-800'
      case 'music': return 'bg-green-100 text-green-800'
      case 'video': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Art Gallery</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Showcase your creative works and discover amazing art from the community
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="all">
                <Image className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
              <TabsTrigger value="image">
                <Image className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Music className="h-4 w-4 mr-2" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search gallery..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Recent
                  </Button>
                  <Button
                    variant={sortBy === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("popular")}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Popular
                  </Button>
                  <Button
                    variant={sortBy === "views" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("views")}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Most Viewed
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterBy === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterBy === "poetry" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("poetry")}
                  >
                    Poetry
                  </Button>
                  <Button
                    variant={filterBy === "art" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy("art")}
                  >
                    Art
                  </Button>
                </div>
                <Button onClick={() => setShowUploadForm(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>

              {/* Gallery Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {galleryItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="aspect-square relative overflow-hidden rounded-t-lg">
                          {item.media_type === 'image' ? (
                            <img
                              src={item.media_url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : item.media_type === 'video' ? (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Play className="h-12 w-12 text-muted-foreground" />
                            </div>
                          ) : item.media_type === 'audio' ? (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Music className="h-12 w-12 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <FileText className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge className={getCategoryColor(item.category)}>
                              {item.category}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="flex items-center">
                              {getMediaIcon(item.media_type)}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-medium line-clamp-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>@{item.user.username}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span>{formatTime(item.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLike(item.id, item.user_has_liked || false)}
                                  className={`flex items-center space-x-1 ${
                                    item.user_has_liked ? 'text-red-500' : 'text-muted-foreground'
                                  }`}
                                >
                                  <Heart className={`h-4 w-4 ${item.user_has_liked ? 'fill-current' : ''}`} />
                                  <span>{item.likes_count}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{item.views_count}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>0</span>
                                </Button>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    <Tag className="h-2 w-2 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Upload Modal */}
          {showUploadForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Upload to Gallery</CardTitle>
                  <CardDescription>Share your creative work with the community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">File</label>
                    <Input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept="image/*,video/*,audio/*,.txt,.md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                    <Textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Describe your work..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="poetry">Poetry</option>
                      <option value="art">Art</option>
                      <option value="music">Music</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                    <Input
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g., nature, love, abstract"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUploadForm(false)
                        setUploadTitle("")
                        setUploadDescription("")
                        setUploadCategory("poetry")
                        setUploadTags("")
                        setUploadFile(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!uploadFile || !uploadTitle.trim()}>
                      Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  function formatTime(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return date.toLocaleDateString()
  }
}