import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Heart, MessageCircle, Feather, Crown, Award, Medal } from "lucide-react"

interface AchievementBadgeProps {
  achievement: string
  size?: "sm" | "md" | "lg"
}

export function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const getAchievementConfig = (achievement: string) => {
    switch (achievement.toLowerCase()) {
      case "first post":
        return {
          icon: <Feather className="h-3 w-3" />,
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          label: "First Post",
        }
      case "popular poet":
        return {
          icon: <Heart className="h-3 w-3" />,
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          label: "Popular Poet",
        }
      case "conversation starter":
        return {
          icon: <MessageCircle className="h-3 w-3" />,
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          label: "Conversation Starter",
        }
      case "rising star":
        return {
          icon: <Star className="h-3 w-3" />,
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          label: "Rising Star",
        }
      case "contest winner":
        return {
          icon: <Trophy className="h-3 w-3" />,
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          label: "Contest Winner",
        }
      case "community champion":
        return {
          icon: <Crown className="h-3 w-3" />,
          color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
          label: "Community Champion",
        }
      case "prolific writer":
        return {
          icon: <Award className="h-3 w-3" />,
          color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
          label: "Prolific Writer",
        }
      case "mentor":
        return {
          icon: <Medal className="h-3 w-3" />,
          color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
          label: "Mentor",
        }
      default:
        return {
          icon: <Star className="h-3 w-3" />,
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          label: achievement,
        }
    }
  }

  const config = getAchievementConfig(achievement)
  const sizeClass = size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs"

  return (
    <Badge className={`${config.color} ${sizeClass} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
