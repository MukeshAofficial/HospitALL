"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function PatientRecordsPage() {
  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecords = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get patient ID first
        const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

        if (patient) {
          const { data, error } = await supabase
            .from("medical_records")
            .select(
              `
              *,
              profiles!medical_records_doctor_id_fkey(full_name)
            `,
            )
            .eq("patient_id", patient.id)
            .order("created_at", { ascending: false })

          if (!error && data) {
            setRecords(data)
          }
        }
      }
      setIsLoading(false)
    }

    fetchRecords()
  }, [])

  const filteredRecords = records.filter((record: any) => record.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-chart-1 text-white"
      case "diagnosis":
        return "bg-chart-2 text-white"
      case "treatment":
        return "bg-chart-3 text-white"
      case "prescription":
        return "bg-purple-600 text-white"
      case "lab_result":
        return "bg-orange-600 text-white"
      case "imaging":
        return "bg-pink-600 text-white"
      default:
        return "bg-muted text-muted-foreground"
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
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Medical Records</h1>
          <p className="text-muted-foreground mt-2">Your complete medical record history</p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Search Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by record title or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record: any) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-serif">{record.title}</CardTitle>
                      <CardDescription>
                        Dr. {record.profiles?.full_name} • {new Date(record.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getRecordTypeColor(record.record_type)}>
                      {record.record_type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Content:</h4>
                      <p className="text-sm text-muted-foreground">{record.content}</p>
                    </div>

                    {record.diagnosis_codes && record.diagnosis_codes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Diagnosis Codes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.diagnosis_codes.map((code: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.medications && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Medications:</h4>
                        <div className="bg-muted p-3 rounded text-sm">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(record.medications, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {record.vital_signs && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Vital Signs:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(record.vital_signs).map(([key, value]) => (
                            <div key={key} className="text-center p-2 bg-muted rounded">
                              <div className="text-lg font-bold">{value as string}</div>
                              <div className="text-xs text-muted-foreground capitalize">{key.replace("_", " ")}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.lab_results && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Lab Results:</h4>
                        <div className="bg-muted p-3 rounded text-sm">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(record.lab_results, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-serif font-medium text-foreground mb-2">No medical records found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No records match your search criteria."
                    : "Your medical records will appear here after your appointments."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  )
}
