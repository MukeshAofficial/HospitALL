"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Calendar, FileText, Activity, BookOpen, History, Heart } from "lucide-react"

export default function PatientDashboard() {
  const [patientData, setPatientData] = useState<any>(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hospitalName, setHospitalName] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Fetch patient profile with hospital info
        const { data: patient } = await supabase
          .from("patients")
          .select(`
            *, 
            profiles!inner(*),
            hospitals(id, name)
          `)
          .eq("profile_id", user.id)
          .single()

        setPatientData(patient)
        
        // Set hospital name if available
        const hospitalInfo = Array.isArray(patient?.hospitals) ? patient.hospitals[0] : patient?.hospitals
        setHospitalName(hospitalInfo?.name || null)

        // Fetch upcoming appointments
        const { data: appointments } = await supabase
          .from("appointments")
          .select(
            `
            *,
            profiles!appointments_doctor_id_fkey(full_name)
          `,
          )
          .eq("patient_id", patient?.id)
          .gte("appointment_date", new Date().toISOString())
          .order("appointment_date", { ascending: true })
          .limit(3)

        setUpcomingAppointments(appointments || [])

        // Fetch recent medical records
        const { data: records } = await supabase
          .from("medical_records")
          .select(
            `
            *,
            profiles!medical_records_doctor_id_fkey(full_name)
          `,
          )
          .eq("patient_id", patient?.id)
          .order("created_at", { ascending: false })
          .limit(3)

        setRecentRecords(records || [])
      }
      setIsLoading(false)
    }

    fetchPatientData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Welcome back, {patientData?.profiles?.full_name}!
          </h1>
          <p className="text-muted-foreground mt-2">Here's an overview of your health information</p>
          {hospitalName && (
            <p className="text-sm text-blue-600 mt-1">Receiving care at {hospitalName}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-chart-1" />
              </div>
              <CardTitle className="text-lg font-serif">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">{upcomingAppointments.length}</div>
              <p className="text-sm text-muted-foreground">Next 30 days</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle className="text-lg font-serif">Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">{recentRecords.length}</div>
              <p className="text-sm text-muted-foreground">Recent entries</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-chart-3/10 rounded-full flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-chart-3" />
              </div>
              <CardTitle className="text-lg font-serif">Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">Good</div>
              <p className="text-sm text-muted-foreground">Overall health</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Your Information</CardTitle>
              <CardDescription>Personal and medical details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{patientData?.profiles?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-sm">{patientData?.profiles?.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="text-sm">
                    {patientData?.date_of_birth
                      ? new Date(patientData.date_of_birth).toLocaleDateString()
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="text-sm">{patientData?.blood_type || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="text-sm capitalize">{patientData?.gender || "Not specified"}</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                <Link href="/patient/profile">Update Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled medical appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">Dr. {appointment.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{appointment.appointment_type}</p>
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
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No upcoming appointments</p>
                )}
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/patient/appointments">View All Appointments</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Recent Medical Records</CardTitle>
              <CardDescription>Latest entries from your healthcare providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRecords.length > 0 ? (
                  recentRecords.map((record: any) => (
                    <div key={record.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{record.title}</p>
                          <p className="text-xs text-muted-foreground">Dr. {record.profiles?.full_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString()}
                          </p>
                          <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                            {record.record_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No medical records yet</p>
                )}
              </div>
              <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                <Link href="/patient/records">View All Records</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
              <CardDescription>Common tasks and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/diary">
                    <BookOpen className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm">Health Diary</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/appointments">
                    <Calendar className="h-6 w-6 mb-2 text-green-600" />
                    <span className="text-sm">Appointments</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/history">
                    <Activity className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="text-sm">Medical History</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/records">
                    <FileText className="h-6 w-6 mb-2 text-orange-600" />
                    <span className="text-sm">Records</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
