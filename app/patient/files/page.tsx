"use client"

import { FileUpload } from "@/components/file-upload"
import { FileViewer } from "@/components/file-viewer"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function PatientFilesPage() {
  const [patientId, setPatientId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    const getPatientId = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()
        if (patient) {
          setPatientId(patient.id)
        }
      }
    }
    getPatientId()
  }, [])

  const handleUploadComplete = () => {
    setShowUpload(false)
  }

  if (!patientId) {
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
            <h1 className="text-3xl font-serif font-bold text-foreground">My Files</h1>
            <p className="text-muted-foreground mt-2">Upload and manage your medical documents and files</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)}>{showUpload ? "Cancel Upload" : "Upload Files"}</Button>
        </div>

        {/* File Upload */}
        {showUpload && <FileUpload patientId={patientId} onUploadComplete={handleUploadComplete} />}

        {/* File Viewer */}
        <FileViewer patientId={patientId} />
      </div>
  )
}
