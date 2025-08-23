"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, Calendar, UserPlus, UserCheck } from "lucide-react"

export default function HospitalDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    activeStaff: 0,
    pendingTasks: 0,
  })
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()

      // Fetch stats
      const { data: patients } = await supabase.from("patients").select("id")
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .gte("appointment_date", new Date().toISOString().split("T")[0])
        .lt("appointment_date", new Date(Date.now() + 86400000).toISOString().split("T")[0])

      const { data: staff } = await supabase.from("profiles").select("id").in("role", ["doctor", "nurse", "admin"])

      setStats({
        totalPatients: patients?.length || 0,
        todayAppointments: appointments?.length || 0,
        activeStaff: staff?.length || 0,
        pendingTasks: 5, // Mock data
      })

      // Fetch recent appointments
      const { data: recent } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients!inner(profile_id, profiles!inner(full_name)),
          profiles!appointments_doctor_id_fkey(full_name)
        `,
        )
        .order("appointment_date", { ascending: true })
        .limit(5)

      setRecentAppointments(recent || [])
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      description: "Registered patients",
      icon: <Users className="h-8 w-8" />,
      color: "text-chart-1",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      description: "Scheduled for today",
      icon: <Calendar className="h-8 w-8" />,
      color: "text-chart-2",
    },
    {
      title: "Active Staff",
      value: stats.activeStaff,
      description: "Healthcare professionals",
      icon: <UserCheck className="h-8 w-8" />,
      color: "text-chart-3",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      description: "Require attention",
      icon: <UserPlus className="h-8 w-8" />,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Hospital Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening at your hospital today.</p>
        </div>
        <div className="flex space-x-3">
          <Button asChild>
            <Link href="/hospital/patients">Manage Patients</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/hospital/schedule">View Schedule</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <div className="h-8 w-8 text-blue-600">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Recent Appointments</CardTitle>
            <CardDescription>Latest scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {appointment.patients?.profiles?.full_name || "Unknown Patient"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {appointment.profiles?.full_name || "Unknown Doctor"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent appointments</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                <Link href="/hospital/patients">
                  <Users className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-sm">Add Patient</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                <Link href="/hospital/schedule">
                  <Calendar className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-sm">Schedule</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                <Link href="/hospital/staff">
                  <UserCheck className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-sm">Manage Staff</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                <Link href="/hospital/onboarding">
                  <UserPlus className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-sm">Onboarding</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
