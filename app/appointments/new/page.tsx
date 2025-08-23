"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Hospital {
  id: string
  name: string
  city: string
  state: string
}

interface Doctor {
  id: string
  full_name: string
}

export default function NewAppointmentPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [patientId, setPatientId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    hospitalId: "",
    doctorId: "",
    date: "",
    timeSlot: "",
    appointmentType: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient()

      // Get current user and patient ID
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()
        setPatientId(patient?.id || null)
      }

      // Fetch hospitals
      const { data: hospitalsData } = await supabase
        .from('hospitals')
        .select('id, name, city, state')
        .eq('status', 'active')
        .order('name')
      
      setHospitals(hospitalsData || [])
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchDoctors = async () => {
      if (formData.hospitalId) {
        const supabase = createClient()
        const { data: doctorsData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'doctor')
          .eq('hospital_id', formData.hospitalId)
          .order('full_name')
        
        setDoctors(doctorsData || [])
        // Reset doctor selection when hospital changes
        setFormData(prev => ({ ...prev, doctorId: "" }))
      }
    }

    fetchDoctors()
  }, [formData.hospitalId])

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (formData.doctorId && formData.date) {
        const response = await fetch(
          `/api/appointments/available-slots?doctorId=${formData.doctorId}&date=${formData.date}`,
        )
        const { availableSlots } = await response.json()
        setAvailableSlots(availableSlots || [])
      }
    }

    fetchAvailableSlots()
  }, [formData.doctorId, formData.date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      setError("Patient information not found")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const appointmentDateTime = new Date(`${formData.date}T${formData.timeSlot}`)

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: formData.doctorId,
          hospital_id: formData.hospitalId,
          appointment_date: appointmentDateTime.toISOString(),
          appointment_type: formData.appointmentType,
          notes: formData.notes,
          duration_minutes: 30,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      router.push("/patient/appointments?success=true")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to book appointment")
    } finally {
      setIsLoading(false)
    }
  }

  const appointmentTypes = [
    "General Consultation",
    "Follow-up",
    "Specialist Consultation",
    "Routine Check-up",
    "Urgent Care",
    "Preventive Care",
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/patient/appointments" className="text-primary hover:underline text-sm">
            ← Back to Appointments
          </Link>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-4">Book New Appointment</h1>
          <p className="text-muted-foreground mt-2">Schedule your next medical appointment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Appointment Details</CardTitle>
            <CardDescription>Fill in the information below to book your appointment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hospital">Select Hospital</Label>
                <Select
                  value={formData.hospitalId}
                  onValueChange={(value) => setFormData({ ...formData, hospitalId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((hospital: any) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name} - {hospital.city}, {hospital.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Select Doctor</Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) => setFormData({ ...formData, doctorId: value })}
                  disabled={!formData.hospitalId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.hospitalId ? "Choose a doctor" : "Select hospital first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {availableSlots.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Available Time Slots</Label>
                  <Select
                    value={formData.timeSlot}
                    onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot: any) => (
                        <SelectItem key={slot.time} value={new Date(slot.time).toTimeString().slice(0, 5)}>
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="appointmentType">Appointment Type</Label>
                <Select
                  value={formData.appointmentType}
                  onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific concerns or information for the doctor..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.doctorId || !formData.date || !formData.timeSlot}
                >
                  {isLoading ? "Booking..." : "Book Appointment"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/patient/appointments">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
