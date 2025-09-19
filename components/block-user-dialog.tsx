"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { UserX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BlockUserDialogProps {
  userId: string
  username: string
  displayName: string
  children?: React.ReactNode
}

export function BlockUserDialog({ userId, username, displayName, children }: BlockUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleBlock = async () => {
    setIsBlocking(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: userId,
      })

      if (error) throw error

      toast({
        title: "User blocked",
        description: `You will no longer see content from @${username}.`,
      })

      setOpen(false)
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Error blocking user",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <UserX className="h-4 w-4 mr-2" />
            Block
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Block @{username}?</DialogTitle>
          <DialogDescription>
            When you block {displayName}, you won't see their posts, comments, or messages. They won't be notified that
            you've blocked them.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">What happens when you block someone:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You won't see their posts in your feed</li>
              <li>• You won't see their comments on posts</li>
              <li>• They can't send you direct messages</li>
              <li>• You can unblock them anytime from your settings</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleBlock} disabled={isBlocking}>
            {isBlocking ? "Blocking..." : "Block User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
