"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const fetchAppointments = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get patient ID first
        const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

        if (patient) {
          const { data, error } = await supabase
            .from("appointments")
            .select(
              `
              *,
              profiles!appointments_doctor_id_fkey(full_name)
            `,
            )
            .eq("patient_id", patient.id)
            .order("appointment_date", { ascending: true })

          if (!error && data) {
            setAppointments(data)
          }
        }
      }
      setIsLoading(false)
    }

    fetchAppointments()

    // Show success message if redirected from booking
    if (searchParams.get("success")) {
      // You could add a toast notification here
      router.replace("/patient/appointments")
    }
  }, [searchParams, router])

  const handleCancelAppointment = async (appointmentId: string) => {
    setActionLoading(appointmentId)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (response.ok) {
        // Refresh appointments
        setAppointments((prev) =>
          prev.map((apt: any) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt)),
        )
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-chart-2 text-white"
      case "confirmed":
        return "bg-chart-1 text-white"
      case "in-progress":
        return "bg-chart-3 text-white"
      case "completed":
        return "bg-green-600 text-white"
      case "cancelled":
        return "bg-chart-4 text-white"
      case "no-show":
        return "bg-gray-600 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const upcomingAppointments = appointments.filter(
    (apt: any) =>
      new Date(apt.appointment_date) >= new Date() && apt.status !== "completed" && apt.status !== "cancelled",
  )
  const pastAppointments = appointments.filter(
    (apt: any) =>
      new Date(apt.appointment_date) < new Date() || apt.status === "completed" || apt.status === "cancelled",
  )

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
            <h1 className="text-3xl font-serif font-bold text-foreground">My Appointments</h1>
            <p className="text-muted-foreground mt-2">View and manage your medical appointments</p>
          </div>
          <Button asChild>
            <Link href="/appointments/new">Book New Appointment</Link>
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg">Dr. {appointment.profiles?.full_name}</h3>
                        <p className="text-muted-foreground">{appointment.appointment_type}</p>
                      </div>
                      <Badge className={getStatusBadgeColor(appointment.status)}>{appointment.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <div className="font-medium">
                          {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="font-medium">
                          {new Date(appointment.appointment_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{appointment.duration_minutes} minutes</div>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <span className="text-muted-foreground text-sm">Notes:</span>
                        <p className="text-sm mt-1">{appointment.notes}</p>
                      </div>
                    )}
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline" disabled>
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={actionLoading === appointment.id}
                      >
                        {actionLoading === appointment.id ? "Cancelling..." : "Cancel"}
                      </Button>
                      <Button size="sm" disabled>
                        Join Video Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <h3 className="text-lg font-serif font-medium text-foreground mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule your next appointment with your healthcare provider
                </p>
                <Button asChild>
                  <Link href="/appointments/new">Book New Appointment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Past Appointments</CardTitle>
            <CardDescription>Your appointment history</CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length > 0 ? (
              <div className="space-y-4">
                {pastAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-4 border border-border rounded-lg opacity-75">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">Dr. {appointment.profiles?.full_name}</h3>
                        <p className="text-muted-foreground text-sm">{appointment.appointment_type}</p>
                      </div>
                      <Badge className={getStatusBadgeColor(appointment.status)}>{appointment.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <div>{new Date(appointment.appointment_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div>
                          {new Date(appointment.appointment_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    {appointment.status === "completed" && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline" disabled>
                          View Summary
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-muted-foreground">No past appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
