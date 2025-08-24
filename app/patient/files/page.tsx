"use client"

import { FileUpload } from "@/components/file-upload"
import { FileViewer } from "@/components/file-viewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Brain, FileText, Upload, TrendingUp, Clock, CheckCircle } from "lucide-react"

export default function PatientFilesPage() {
  const [patientId, setPatientId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [fileStats, setFileStats] = useState({
    total: 0,
    analyzed: 0,
    recentUploads: 0,
    types: {} as Record<string, number>
  })

  useEffect(() => {
    const getPatientData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()
        if (patient) {
          setPatientId(patient.id)
          
          // Fetch file statistics
          const { data: files } = await supabase
            .from("file_attachments")
            .select("*")
            .eq("patient_id", patient.id)
          
          if (files) {
            const now = new Date()
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            
            const analyzed = files.filter(f => f.ai_analysis).length
            const recent = files.filter(f => new Date(f.created_at) > thirtyDaysAgo).length
            
            const types = files.reduce((acc: Record<string, number>, file) => {
              const type = file.file_type.split('/')[0]
              acc[type] = (acc[type] || 0) + 1
              return acc
            }, {})
            
            setFileStats({
              total: files.length,
              analyzed,
              recentUploads: recent,
              types
            })
          }
        }
      }
    }
    getPatientData()
  }, [showUpload])

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
            <h1 className="text-3xl font-serif font-bold text-foreground">My Medical Files</h1>
            <p className="text-muted-foreground mt-2">Upload, manage, and analyze your medical documents with AI</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            {showUpload ? "Cancel Upload" : "Upload Files"}
          </Button>
        </div>

        {/* File Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.total}</div>
              <p className="text-xs text-muted-foreground">Medical documents</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Analyzed</CardTitle>
              <Brain className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{fileStats.analyzed}</div>
              <p className="text-xs text-muted-foreground">
                {fileStats.total > 0 ? Math.round((fileStats.analyzed / fileStats.total) * 100) : 0}% analyzed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fileStats.recentUploads}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Types</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{Object.keys(fileStats.types).length}</div>
              <p className="text-xs text-muted-foreground">Different formats</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Brain className="h-5 w-5 mr-2" />
              AI-Powered Document Analysis
            </CardTitle>
            <CardDescription className="text-blue-700">
              Get instant, comprehensive analysis of your medical documents using advanced AI technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Lab Results Analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Prescription Reviews</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Medical Report Summaries</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Imaging Report Analysis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        {showUpload && <FileUpload patientId={patientId} onUploadComplete={handleUploadComplete} />}

        {/* File Viewer */}
        <FileViewer patientId={patientId} />
      </div>
  )
}
