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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Flag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportDialogProps {
  contentType: "post" | "comment" | "user"
  contentId: string
  reportedUserId?: string
  children?: React.ReactNode
}

const REPORT_REASONS = {
  post: [
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment" },
    { value: "hate-speech", label: "Hate Speech" },
    { value: "violence", label: "Violence or Threats" },
    { value: "copyright", label: "Copyright Violation" },
    { value: "other", label: "Other" },
  ],
  comment: [
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment" },
    { value: "hate-speech", label: "Hate Speech" },
    { value: "off-topic", label: "Off Topic" },
    { value: "other", label: "Other" },
  ],
  user: [
    { value: "harassment", label: "Harassment" },
    { value: "spam", label: "Spam Account" },
    { value: "impersonation", label: "Impersonation" },
    { value: "hate-speech", label: "Hate Speech" },
    { value: "inappropriate-profile", label: "Inappropriate Profile" },
    { value: "other", label: "Other" },
  ],
}

export function ReportDialog({ contentType, contentId, reportedUserId, children }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Please select a reason",
        description: "You must select a reason for reporting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const reportData = {
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reported_user_id: reportedUserId,
        reason,
        description: description.trim() || null,
        status: "pending",
      }

      const { error } = await supabase.from("reports").insert(reportData)

      if (error) throw error

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe. We'll review this report.",
      })

      setOpen(false)
      setReason("")
      setDescription("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error submitting report",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Help us maintain a safe and respectful community. Your report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS[contentType].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context that might help our review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
