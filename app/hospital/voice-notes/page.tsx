"use client"

import { VoiceRecorder } from "@/components/voice-recorder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function VoiceNotesPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState("")
  const [recentTranscriptions, setRecentTranscriptions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPatients()
    fetchRecentTranscriptions()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchAppointments(selectedPatient)
    }
  }, [selectedPatient])

  const fetchPatients = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("patients")
      .select("id, profiles!inner(full_name)")
      .order("profiles(full_name)")

    setPatients(data || [])
  }

  const fetchAppointments = async (patientId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_type")
      .eq("patient_id", patientId)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date")

    setAppointments(data || [])
  }

  const fetchRecentTranscriptions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("voice_transcriptions")
      .select(
        `
        *,
        patients!inner(profiles!inner(full_name)),
        profiles!voice_transcriptions_doctor_id_fkey(full_name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(10)

    setRecentTranscriptions(data || [])
  }

  const handleTranscriptionComplete = (result: any) => {
    // Refresh recent transcriptions
    fetchRecentTranscriptions()
    // Reset selections
    setSelectedPatient("")
    setSelectedAppointment("")
  }

  const filteredTranscriptions = recentTranscriptions.filter((transcription: any) =>
    transcription.patients?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Voice Notes & Transcription</h1>
          <p className="text-muted-foreground mt-2">Record and transcribe medical consultations with AI assistance</p>
        </div>

        {/* Patient and Appointment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Select Patient & Appointment</CardTitle>
            <CardDescription>Choose the patient and appointment for this recording session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient</label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.profiles.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Appointment (Optional)</label>
                <Select value={selectedAppointment} onValueChange={setSelectedAppointment} disabled={!selectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((appointment: any) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {new Date(appointment.appointment_date).toLocaleDateString()} - {appointment.appointment_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Recorder */}
        {selectedPatient && (
          <VoiceRecorder
            patientId={selectedPatient}
            appointmentId={selectedAppointment || undefined}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
        )}

        {/* Recent Transcriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Recent Transcriptions</CardTitle>
            <CardDescription>Previously recorded and transcribed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search transcriptions by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />

              <div className="space-y-4">
                {filteredTranscriptions.length > 0 ? (
                  filteredTranscriptions.map((transcription: any) => (
                    <div key={transcription.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">
                            Patient: {transcription.patients?.profiles?.full_name || "Unknown"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Dr. {transcription.profiles?.full_name} •{" "}
                            {new Date(transcription.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            transcription.processing_status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {transcription.processing_status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Raw Transcription:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {transcription.raw_transcription}
                          </p>
                        </div>

                        {transcription.structured_notes && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Key Points:</h4>
                            <div className="text-sm space-y-1">
                              {transcription.structured_notes.chief_complaint && (
                                <div>
                                  <span className="font-medium">Chief Complaint:</span>{" "}
                                  {transcription.structured_notes.chief_complaint}
                                </div>
                              )}
                              {transcription.structured_notes.assessment && (
                                <div>
                                  <span className="font-medium">Assessment:</span>{" "}
                                  {transcription.structured_notes.assessment}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Full Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Export Notes
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎤</div>
                    <h3 className="text-lg font-serif font-medium text-foreground mb-2">No transcriptions found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No transcriptions match your search criteria."
                        : "Start recording to create your first transcription."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
