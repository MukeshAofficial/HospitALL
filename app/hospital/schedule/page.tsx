"use client"

import { MedicalCalendar } from "@/components/medical-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus, Calendar as CalendarIcon } from "lucide-react"

interface Appointment {
  id: string
  patient_name: string
  doctor_name: string
  appointment_date: string
  duration_minutes: number
  status: string
  appointment_type: string
  notes?: string
  patient_id: string
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const fetchAppointments = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients!inner(
            profile_id, 
            profiles!inner(full_name)
          ),
          profiles!appointments_doctor_id_fkey(full_name)
        `,
        )
        .order("appointment_date", { ascending: true })

      if (!error && data) {
        // Transform data for calendar component
        const transformedAppointments = data.map((apt: any) => ({
          id: apt.id,
          patient_name: apt.patients?.profiles?.full_name || "Unknown Patient",
          doctor_name: apt.profiles?.full_name || "Unknown Doctor",
          appointment_date: apt.appointment_date,
          duration_minutes: apt.duration_minutes,
          status: apt.status,
          appointment_type: apt.appointment_type,
          notes: apt.notes,
          patient_id: apt.patient_id
        }))
        setAppointments(transformedAppointments)
      }
      setIsLoading(false)
    }

    fetchAppointments()
  }, [])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAppointmentClick = (appointment: any) => {
    // Handle appointment click - could navigate to detail view
    console.log('Appointment clicked:', appointment)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
              <p className="text-gray-600 mt-1">Manage appointments and view hospital schedule</p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/hospital/schedule/new" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Appointment</span>
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter((apt: any) => 
                      new Date(apt.appointment_date).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter((apt: any) => apt.status === 'confirmed').length}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter((apt: any) => apt.status === 'scheduled').length}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Large Professional Calendar */}
        <MedicalCalendar
          appointments={appointments}
          onDateSelect={handleDateSelect}
          onAppointmentClick={handleAppointmentClick}
          className="w-full"
        />
      </div>
  )
}
