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
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Mic,
  BookOpen,
  Trophy,
  Coffee,
  Music,
  Camera,
  Video,
  Timer,
  Star
} from "lucide-react"

interface Event {
  id: string
  title: string
  description?: string
  event_type: string
  host: {
    username: string
    display_name: string
    avatar_url?: string
  }
  start_time: string
  end_time: string
  max_participants?: number
  is_public: boolean
  status: string
  created_at: string
  participant_count?: number
  user_is_participant?: boolean
}

interface EventStats {
  total_events: number
  events_hosted: number
  events_participated: number
  upcoming_events: number
}

export default function EventsPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [userStats, setUserStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventType, setEventType] = useState("open_mic")
  const [eventStartTime, setEventStartTime] = useState("")
  const [eventEndTime, setEventEndTime] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [isPublic, setIsPublic] = useState(true)
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
      fetchEvents()
      fetchUserStats()
    }
  }, [user, activeTab])

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from("events")
        .select(`
          id,
          title,
          description,
          event_type,
          start_time,
          end_time,
          max_participants,
          is_public,
          status,
          created_at,
          profiles!events_host_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)

      // Filter by status
      const now = new Date().toISOString()
      if (activeTab === "upcoming") {
        query = query.gte("start_time", now).in("status", ["scheduled", "live"])
      } else if (activeTab === "live") {
        query = query.eq("status", "live")
      } else if (activeTab === "past") {
        query = query.lt("end_time", now).eq("status", "completed")
      } else if (activeTab === "my-events") {
        query = query.eq("host_id", user.id)
      }

      query = query.order("start_time", { ascending: true })

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Get participant counts and user participation status
      const eventIds = data?.map(event => event.id) || []
      const { data: participants } = await supabase
        .from("event_participants")
        .select("event_id, user_id")
        .in("event_id", eventIds)

      const participantCounts = new Map()
      const userParticipations = new Map()

      participants?.forEach(participant => {
        const count = participantCounts.get(participant.event_id) || 0
        participantCounts.set(participant.event_id, count + 1)
        
        if (participant.user_id === user.id) {
          userParticipations.set(participant.event_id, true)
        }
      })

      const eventsWithParticipants = data?.map(event => ({
        ...event,
        participant_count: participantCounts.get(event.id) || 0,
        user_is_participant: userParticipations.get(event.id) || false
      }))

      setEvents(eventsWithParticipants || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const { count: totalEvents } = await supabase
        .from("events")
        .select("*", { count: 'exact', head: true })
        .or(`host_id.eq.${user.id},participants.user_id.eq.${user.id}`)

      const { count: eventsHosted } = await supabase
        .from("events")
        .select("*", { count: 'exact', head: true })
        .eq("host_id", user.id)

      const { count: eventsParticipated } = await supabase
        .from("event_participants")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)

      const now = new Date().toISOString()
      const { count: upcomingEvents } = await supabase
        .from("events")
        .select("*", { count: 'exact', head: true })
        .gte("start_time", now)
        .in("status", ["scheduled", "live"])

      setUserStats({
        total_events: totalEvents || 0,
        events_hosted: eventsHosted || 0,
        events_participated: eventsParticipated || 0,
        upcoming_events: upcomingEvents || 0
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const createEvent = async () => {
    if (!eventTitle.trim() || !eventStartTime || !eventEndTime) return

    try {
      const { error } = await supabase
        .from("events")
        .insert({
          host_id: user.id,
          title: eventTitle,
          description: eventDescription || null,
          event_type: eventType,
          start_time: eventStartTime,
          end_time: eventEndTime,
          max_participants: maxParticipants ? parseInt(maxParticipants) : null,
          is_public: isPublic,
          status: "scheduled"
        })

      if (error) throw error

      // Reset form
      setEventTitle("")
      setEventDescription("")
      setEventType("open_mic")
      setEventStartTime("")
      setEventEndTime("")
      setMaxParticipants("")
      setIsPublic(true)
      setShowCreateEvent(false)

      // Refresh events
      fetchEvents()
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  const joinEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("event_participants")
        .insert({
          event_id: eventId,
          user_id: user.id
        })

      if (error) throw error

      // Refresh events
      fetchEvents()
    } catch (error) {
      console.error("Error joining event:", error)
    }
  }

  const leaveEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id)

      if (error) throw error

      // Refresh events
      fetchEvents()
    } catch (error) {
      console.error("Error leaving event:", error)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'open_mic': return <Mic className="h-5 w-5" />
      case 'workshop': return <BookOpen className="h-5 w-5" />
      case 'contest': return <Trophy className="h-5 w-5" />
      case 'social': return <Coffee className="h-5 w-5" />
      case 'music': return <Music className="h-5 w-5" />
      case 'photography': return <Camera className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      default: return <Calendar className="h-5 w-5" />
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'open_mic': return 'bg-purple-100 text-purple-800'
      case 'workshop': return 'bg-blue-100 text-blue-800'
      case 'contest': return 'bg-yellow-100 text-yellow-800'
      case 'social': return 'bg-green-100 text-green-800'
      case 'music': return 'bg-pink-100 text-pink-800'
      case 'photography': return 'bg-indigo-100 text-indigo-800'
      case 'video': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'live': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getTimeUntilEvent = (startTime: string) => {
    const now = new Date()
    const eventTime = new Date(startTime)
    const diff = eventTime.getTime() - now.getTime()
    
    if (diff <= 0) return "Started"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
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
              <Calendar className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-foreground">Virtual Café & Events</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join live events, workshops, and community gatherings in our virtual space
            </p>
          </motion.div>

          {/* User Stats Overview */}
          {userStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{userStats.total_events}</div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Mic className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{userStats.events_hosted}</div>
                  <div className="text-sm text-muted-foreground">Hosted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{userStats.events_participated}</div>
                  <div className="text-sm text-muted-foreground">Participated</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-foreground">{userStats.upcoming_events}</div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="upcoming">
                <Clock className="h-4 w-4 mr-2" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="live">
                <Play className="h-4 w-4 mr-2" />
                Live Now
              </TabsTrigger>
              <TabsTrigger value="past">
                <CheckCircle className="h-4 w-4 mr-2" />
                Past Events
              </TabsTrigger>
              <TabsTrigger value="my-events">
                <Star className="h-4 w-4 mr-2" />
                My Events
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold">Upcoming Events</h2>
                <Button onClick={() => setShowCreateEvent(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card className="group hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {getEventIcon(event.event_type)}
                              </div>
                              <div className="flex-1">
                                <CardTitle className="font-serif text-xl">{event.title}</CardTitle>
                                {event.description && (
                                  <CardDescription className="mt-1">
                                    {event.description}
                                  </CardDescription>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>by {event.host.display_name}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDateTime(event.start_time).date} at {formatDateTime(event.start_time).time}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={getEventTypeColor(event.event_type)}>
                                {event.event_type.replace('_', ' ')}
                              </Badge>
                              <Badge className={getStatusColor(event.status)}>
                                {event.status}
                              </Badge>
                              <Badge variant="outline" className="flex items-center">
                                <Timer className="h-3 w-3 mr-1" />
                                {getTimeUntilEvent(event.start_time)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  {event.participant_count} 
                                  {event.max_participants && ` / ${event.max_participants}`} 
                                  participants
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Virtual Event</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {event.user_is_participant ? (
                                <Button variant="outline" onClick={() => leaveEvent(event.id)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Leave
                                </Button>
                              ) : (
                                <Button 
                                  onClick={() => joinEvent(event.id)}
                                  disabled={event.max_participants && event.participant_count >= event.max_participants}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Join
                                </Button>
                              )}
                              <Button variant="outline">
                                <Play className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="live" className="space-y-6">
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Live Events</h3>
                <p className="text-muted-foreground">
                  Currently live events will appear here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="past" className="space-y-6">
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Past Events</h3>
                <p className="text-muted-foreground">
                  Completed events will appear here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="my-events" className="space-y-6">
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">My Events</h3>
                <p className="text-muted-foreground">
                  Events you've created or participated in
                </p>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Create New Event</CardTitle>
                  <CardDescription>Host your own virtual event for the community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Title</label>
                    <Input
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Describe your event..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="open_mic">Open Mic</option>
                      <option value="workshop">Workshop</option>
                      <option value="contest">Contest</option>
                      <option value="social">Social</option>
                      <option value="music">Music</option>
                      <option value="photography">Photography</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Time</label>
                      <Input
                        type="datetime-local"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Time</label>
                      <Input
                        type="datetime-local"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Participants (optional)</label>
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <label htmlFor="isPublic" className="text-sm font-medium">
                      Public event (visible to all users)
                    </label>
                  </div>
                  <Button onClick={createEvent} className="w-full" disabled={!eventTitle.trim() || !eventStartTime || !eventEndTime}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}