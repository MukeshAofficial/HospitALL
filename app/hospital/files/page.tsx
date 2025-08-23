"use client"

import { HospitalLayout } from "@/components/hospital-layout"
import { FileUpload } from "@/components/file-upload"
import { FileViewer } from "@/components/file-viewer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function FilesPage() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("patients")
      .select("id, profiles!inner(full_name)")
      .order("profiles(full_name)")

    setPatients(data || [])
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    // The FileViewer will automatically refresh
  }

  const filteredPatients = patients.filter((patient: any) =>
    patient.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <HospitalLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">File Management</h1>
          <p className="text-muted-foreground mt-2">Upload and manage patient medical files and documents</p>
        </div>

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Select Patient</CardTitle>
            <CardDescription>Choose a patient to view or upload files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPatients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File Management */}
        {selectedPatient && (
          <div className="space-y-6">
            {/* Upload Toggle */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-serif font-semibold">
                Files for {patients.find((p: any) => p.id === selectedPatient)?.profiles?.full_name}
              </h2>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {showUpload ? "Cancel Upload" : "Upload Files"}
              </button>
            </div>

            {/* File Upload */}
            {showUpload && <FileUpload patientId={selectedPatient} onUploadComplete={handleUploadComplete} />}

            {/* File Viewer */}
            <FileViewer patientId={selectedPatient} />
          </div>
        )}

        {/* File Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">File Statistics</CardTitle>
            <CardDescription>Overview of file storage and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-1">0</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-2">0 MB</div>
                <div className="text-sm text-muted-foreground">Storage Used</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-3">0</div>
                <div className="text-sm text-muted-foreground">Images</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-4">0</div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  )
}
