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

interface PatientWithHospital {
  id: string
  hospital_id: string
  hospitals: Hospital
}

export default function NewAppointmentPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [patientId, setPatientId] = useState<string | null>(null)
  const [patientHospitalId, setPatientHospitalId] = useState<string | null>(null)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null)
  const [hospitalName, setHospitalName] = useState<string | null>(null)
  const [hasSelectedHospital, setHasSelectedHospital] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    timeSlot: "",
    appointmentType: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true)
      setError(null)
      
      try {
        const supabase = createClient()

        // Get current user and patient info
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("User not authenticated")
          return
        }

        // Get patient record with hospital info
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select('id, hospital_id')
          .eq("profile_id", user.id)
          .maybeSingle()
        
        if (patientError) {
          console.error('Patient fetch error:', patientError)
          setError("Failed to load patient information. Please contact support.")
          return
        }

        if (!patient) {
          setError("Patient record not found. Please complete your profile first.")
          return
        }

        setPatientId(patient.id)
        
        // Fetch all available hospitals
        const { data: hospitalsData } = await supabase
          .from('hospitals')
          .select('id, name, city, state')
          .eq('status', 'active')
          .order('name')
        
        setHospitals(hospitalsData || [])
        
        // Check if patient has selected a hospital
        if (!patient.hospital_id) {
          setHasSelectedHospital(false)
          // Don't set error here, let user select hospital
          return
        }

        setHasSelectedHospital(true)
        setPatientHospitalId(patient.hospital_id)
        setSelectedHospitalId(patient.hospital_id)
        const selectedHospital = (hospitalsData || []).find((h: any) => h.id === patient.hospital_id)
        setHospitalName(selectedHospital?.name || "Selected Hospital")
        
        // Fetch doctors from the selected hospital
        await fetchDoctorsForHospital(patient.hospital_id)
        
      } catch (err) {
        console.error('Error in fetchInitialData:', err)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchInitialData()
  }, [])

  const fetchDoctorsForHospital = async (hospitalId: string) => {
    try {
      const supabase = createClient()
      
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'doctor')
        .eq('hospital_id', hospitalId)
        .order('full_name')
      
      if (doctorsError) {
        console.error('Doctors fetch error:', doctorsError)
        setError("Failed to load doctors. Please try again.")
        return
      }

      console.log('Fetched doctors:', doctorsData)
      setDoctors(doctorsData || [])
      
      if (!doctorsData || doctorsData.length === 0) {
        const selectedHospital = hospitals.find(h => h.id === hospitalId)
        setError(`No doctors are currently available at ${selectedHospital?.name || 'the selected hospital'}. Please try a different hospital or contact them directly.`)
      } else {
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setError("Failed to load doctors. Please try again.")
    }
  }

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospitalId(hospitalId)
    setFormData(prev => ({ ...prev, doctorId: "" })) // Reset doctor selection
    
    const selectedHospital = hospitals.find(h => h.id === hospitalId)
    setHospitalName(selectedHospital?.name || "Selected Hospital")
    
    // Update patient's hospital selection
    if (patientId) {
      const supabase = createClient()
      await supabase
        .from('patients')
        .update({ hospital_id: hospitalId })
        .eq('id', patientId)
      
      setPatientHospitalId(hospitalId)
    }
    
    // Fetch doctors for the new hospital
    await fetchDoctorsForHospital(hospitalId)
  }

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
          hospital_id: selectedHospitalId || patientHospitalId,
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
          {hospitalName && (
            <p className="text-sm text-blue-600 mt-1">at {hospitalName}</p>
          )}
        </div>

        {/* Loading state */}
        {isLoadingData && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading appointment information...</span>
            </CardContent>
          </Card>
        )}

        {/* Hospital selection prompt */}
        {!isLoadingData && hasSelectedHospital === false && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Select Hospital</CardTitle>
              <CardDescription>
                Choose the hospital where you'd like to book your appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospital">Available Hospitals</Label>
                <Select
                  value={selectedHospitalId || ""}
                  onValueChange={handleHospitalChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name} - {hospital.city}, {hospital.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hospitals.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hospitals are currently available. Please contact support.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error display */}
        {!isLoadingData && error && hasSelectedHospital !== false && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
                {error.includes('No doctors') && (
                  <div className="text-sm text-gray-600">
                    <p>This could happen if:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>No doctors have been added to your hospital yet</li>
                      <li>All doctors are currently unavailable</li>
                      <li>There's a temporary system issue</li>
                    </ul>
                    <p className="mt-3">
                      Please contact {hospitalName || 'your hospital'} directly to schedule an appointment.
                    </p>
                  </div>
                )}
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment booking form */}
        {!isLoadingData && (hasSelectedHospital === true || selectedHospitalId) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Appointment Details</CardTitle>
              <CardDescription>Fill in the information below to book your appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hospital Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hospital">Hospital</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHasSelectedHospital(false)
                        setSelectedHospitalId(null)
                        setDoctors([])
                        setFormData(prev => ({ ...prev, doctorId: "" }))
                      }}
                    >
                      Change Hospital
                    </Button>
                  </div>
                  <Select
                    value={selectedHospitalId || patientHospitalId || ""}
                    onValueChange={handleHospitalChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name} - {hospital.city}, {hospital.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Doctor Selection */}
                <div className="space-y-2">
                  <Label htmlFor="doctor">Select Doctor</Label>
                  <Select
                    value={formData.doctorId}
                    onValueChange={(value) => setFormData({ ...formData, doctorId: value })}
                    required
                    disabled={!selectedHospitalId && !patientHospitalId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={doctors.length > 0 ? "Choose a doctor" : "Select a hospital first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(selectedHospitalId || patientHospitalId) && doctors.length === 0 && !error && (
                    <p className="text-sm text-gray-500">
                      Loading doctors for {hospitalName}...
                    </p>
                  )}
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
                    disabled={isLoading || !formData.doctorId || !formData.date || !formData.timeSlot || doctors.length === 0 || !(selectedHospitalId || patientHospitalId)}
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
        )}
      </div>
    </div>
  )
}
