"use client"

import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  MessageCircle, 
  Users, 
  Hash, 
  Send, 
  Pin,
  Smile,
  AtSign,
  MoreVertical,
  Volume2,
  VolumeX
} from "lucide-react"

interface Channel {
  id: string
  name: string
  description: string
  channel_type: string
  created_at: string
  created_by: {
    username: string
    display_name: string
  }
}

interface Message {
  id: string
  content: string
  message_type: string
  created_at: string
  user: {
    username: string
    display_name: string
    avatar_url?: string
  }
  reply_to?: {
    id: string
    content: string
    user: {
      username: string
      display_name: string
    }
  }
  is_pinned: boolean
}

export default function LoungePage() {
  const [user, setUser] = useState<any>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<number>(0)
  const [isMuted, setIsMuted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
      fetchChannels()
    }
  }, [user])

  useEffect(() => {
    if (activeChannel) {
      fetchMessages()
      subscribeToMessages()
    }
  }, [activeChannel])

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_channels")
        .select(`
          id,
          name,
          description,
          channel_type,
          created_at,
          profiles!chat_channels_created_by_fkey (
            username,
            display_name
          )
        `)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setChannels(data || [])
      
      // Set first channel as active
      if (data && data.length > 0) {
        setActiveChannel(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching channels:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!activeChannel) return

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          id,
          content,
          message_type,
          created_at,
          is_pinned,
          profiles!chat_messages_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          reply_to:chat_messages!chat_messages_reply_to_id_fkey (
            id,
            content,
            profiles!chat_messages_user_id_fkey (
              username,
              display_name
            )
          )
        `)
        .eq("channel_id", activeChannel)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const subscribeToMessages = () => {
    if (!activeChannel) return

    const channel = supabase
      .channel(`chat:${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${activeChannel}`
        },
        (payload) => {
          const newMessage = payload.new as any
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return

    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          channel_id: activeChannel,
          user_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        })

      if (error) throw error
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return date.toLocaleDateString()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!user) {
    return <div>Loading...</div>
  }

  const currentChannel = channels.find(c => c.id === activeChannel)

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
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Community Lounge</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow poets and writers in real-time conversations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
            {/* Channels Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Channels
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {onlineUsers} online
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 p-2">
                    {channels.map((channel) => (
                      <Button
                        key={channel.id}
                        variant={activeChannel === channel.id ? "secondary" : "ghost"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => setActiveChannel(channel.id)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center w-full">
                            <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{channel.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 text-left">
                            {channel.description}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3 flex flex-col">
              {currentChannel ? (
                <>
                  {/* Channel Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Hash className="h-5 w-5 mr-2" />
                          {currentChannel.name}
                        </CardTitle>
                        <CardDescription>{currentChannel.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-start space-x-3 group hover:bg-muted/30 p-2 rounded-lg transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {message.user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">
                                  {message.user.display_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  @{message.user.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(message.created_at)}
                                </span>
                                {message.is_pinned && (
                                  <Pin className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-foreground whitespace-pre-wrap">
                                {message.content}
                              </div>
                              {message.reply_to && (
                                <div className="mt-2 p-2 bg-muted/50 rounded border-l-2 border-primary/50">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Replying to {message.reply_to.user.display_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {message.reply_to.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message #${currentChannel.name}`}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>Press Enter to send</span>
                        <span>Shift + Enter for new line</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <AtSign className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Select a Channel</h3>
                    <p className="text-muted-foreground">
                      Choose a channel from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Quick Actions</h3>
                    <p className="text-sm text-muted-foreground">
                      Jump into conversations or start new ones
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Hash className="h-4 w-4 mr-2" />
                      Create Channel
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Invite Friends
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}