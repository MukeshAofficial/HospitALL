"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface DiaryEntry {
  id: string
  date: string
  mood: string
  symptoms: string
  notes: string
  pain_level: number
  sleep_hours: number
  created_at: string
}

export default function HealthDiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    mood: "",
    symptoms: "",
    notes: "",
    pain_level: 0,
    sleep_hours: 8,
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // For now, we'll use a mock table structure since diary entries aren't in our schema
      // In a real implementation, you'd create a diary_entries table
      setEntries([
        {
          id: "1",
          date: "2024-01-15",
          mood: "good",
          symptoms: "Slight headache in the morning",
          notes: "Felt better after drinking more water",
          pain_level: 2,
          sleep_hours: 7,
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          date: "2024-01-14",
          mood: "excellent",
          symptoms: "None",
          notes: "Great day overall, went for a walk",
          pain_level: 0,
          sleep_hours: 8,
          created_at: "2024-01-14T09:00:00Z",
        },
      ])
    }
    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, you'd save to the database
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      ...formData,
      created_at: new Date().toISOString(),
    }
    setEntries((prev) => [newEntry, ...prev])
    setFormData({
      date: new Date().toISOString().split("T")[0],
      mood: "",
      symptoms: "",
      notes: "",
      pain_level: 0,
      sleep_hours: 8,
    })
    setShowForm(false)
  }

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "excellent":
        return "text-green-600 bg-green-50"
      case "good":
        return "text-blue-600 bg-blue-50"
      case "okay":
        return "text-yellow-600 bg-yellow-50"
      case "poor":
        return "text-orange-600 bg-orange-50"
      case "terrible":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Health Diary</h1>
            <p className="text-muted-foreground mt-2">Track your daily health and wellness</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add Entry"}</Button>
        </div>

        {/* Add Entry Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">New Diary Entry</CardTitle>
              <CardDescription>Record your daily health information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mood">Mood</Label>
                    <Select value={formData.mood} onValueChange={(value) => handleInputChange("mood", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="How are you feeling?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="okay">Okay</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="terrible">Terrible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pain_level">Pain Level (0-10)</Label>
                    <Input
                      id="pain_level"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.pain_level}
                      onChange={(e) => handleInputChange("pain_level", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sleep_hours">Sleep Hours</Label>
                    <Input
                      id="sleep_hours"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.sleep_hours}
                      onChange={(e) => handleInputChange("sleep_hours", Number.parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="symptoms">Symptoms</Label>
                    <Input
                      id="symptoms"
                      value={formData.symptoms}
                      onChange={(e) => handleInputChange("symptoms", e.target.value)}
                      placeholder="Any symptoms you experienced today"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Additional notes about your day"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Entry</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Diary Entries */}
        <div className="space-y-4">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-serif">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                      <CardDescription>Recorded on {new Date(entry.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getMoodColor(entry.mood)}`}
                    >
                      {entry.mood}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-chart-1">{entry.pain_level}/10</div>
                      <div className="text-sm text-muted-foreground">Pain Level</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-chart-2">{entry.sleep_hours}h</div>
                      <div className="text-sm text-muted-foreground">Sleep</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-chart-3 capitalize">{entry.mood}</div>
                      <div className="text-sm text-muted-foreground">Mood</div>
                    </div>
                  </div>

                  {entry.symptoms && (
                    <div className="mb-3">
                      <h4 className="font-medium text-sm mb-1">Symptoms:</h4>
                      <p className="text-sm text-muted-foreground">{entry.symptoms}</p>
                    </div>
                  )}

                  {entry.notes && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Notes:</h4>
                      <p className="text-sm text-muted-foreground">{entry.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-serif font-medium text-foreground mb-2">No diary entries yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your daily health and wellness</p>
                <Button onClick={() => setShowForm(true)}>Add Your First Entry</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  )
}
