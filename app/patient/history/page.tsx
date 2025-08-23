"use client"

import { PatientLayout } from "@/components/patient-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function PatientHistoryPage() {
  const [patientData, setPatientData] = useState<any>(null)
  const [medicalHistory, setMedicalHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPatientHistory = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get patient data
        const { data: patient } = await supabase
          .from("patients")
          .select("*, profiles!inner(*)")
          .eq("profile_id", user.id)
          .single()

        setPatientData(patient)

        // Get medical records for history
        if (patient) {
          const { data: records } = await supabase
            .from("medical_records")
            .select(
              `
              *,
              profiles!medical_records_doctor_id_fkey(full_name)
            `,
            )
            .eq("patient_id", patient.id)
            .order("created_at", { ascending: false })

          setMedicalHistory(records || [])
        }
      }
      setIsLoading(false)
    }

    fetchPatientHistory()
  }, [])

  if (isLoading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PatientLayout>
    )
  }

  return (
    <PatientLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Medical History</h1>
          <p className="text-muted-foreground mt-2">Your complete medical profile and history</p>
        </div>

        {/* Patient Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Personal Information</CardTitle>
              <CardDescription>Basic demographic and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{patientData?.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{patientData?.profiles?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{patientData?.profiles?.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span>
                    {patientData?.date_of_birth
                      ? new Date(patientData.date_of_birth).toLocaleDateString()
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize">{patientData?.gender || "Not specified"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Medical Information</CardTitle>
              <CardDescription>Important medical details and emergency contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="font-medium">{patientData?.blood_type || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emergency Contact:</span>
                  <span>{patientData?.emergency_contact_name || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emergency Phone:</span>
                  <span>{patientData?.emergency_contact_phone || "Not provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Allergies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Allergies</CardTitle>
            <CardDescription>Known allergies and adverse reactions</CardDescription>
          </CardHeader>
          <CardContent>
            {patientData?.allergies && patientData.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patientData.allergies.map((allergy: string, index: number) => (
                  <Badge key={index} variant="destructive">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No known allergies</p>
            )}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Current Medications</CardTitle>
            <CardDescription>Medications you are currently taking</CardDescription>
          </CardHeader>
          <CardContent>
            {patientData?.current_medications && patientData.current_medications.length > 0 ? (
              <div className="space-y-2">
                {patientData.current_medications.map((medication: string, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <span className="font-medium">{medication}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No current medications</p>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Medical History</CardTitle>
            <CardDescription>Past medical conditions and treatments</CardDescription>
          </CardHeader>
          <CardContent>
            {patientData?.medical_history ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{patientData.medical_history}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No medical history recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Medical Records Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Recent Medical Activity</CardTitle>
            <CardDescription>Timeline of recent medical records and treatments</CardDescription>
          </CardHeader>
          <CardContent>
            {medicalHistory.length > 0 ? (
              <div className="space-y-4">
                {medicalHistory.slice(0, 5).map((record: any, index: number) => (
                  <div key={record.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{record.title}</h4>
                          <p className="text-xs text-muted-foreground">Dr. {record.profiles?.full_name}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{record.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent medical activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  )
}
