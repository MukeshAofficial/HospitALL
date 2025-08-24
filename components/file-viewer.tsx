"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DocumentAnalyzer } from "@/components/document-analyzer"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Brain, ChevronDown, ChevronUp } from "lucide-react"
import { parseMarkdownText, isNumberedItem, extractNumber, extractNumberedContent } from "@/lib/utils/markdown-parser"

interface FileViewerProps {
  patientId: string
  medicalRecordId?: string
  showUpload?: boolean
}

export function FileViewer({ patientId, medicalRecordId, showUpload = false }: FileViewerProps) {
  const [files, setFiles] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [expandedAnalyzer, setExpandedAnalyzer] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [patientId, medicalRecordId])

  const fetchFiles = async () => {
    const supabase = createClient()
    let query = supabase
      .from("file_attachments")
      .select(
        `
        *,
        profiles!file_attachments_uploaded_by_fkey(full_name)
      `,
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    if (medicalRecordId) {
      query = query.eq("medical_record_id", medicalRecordId)
    }

    const { data, error } = await query

    if (!error && data) {
      setFiles(data)
    }
    setIsLoading(false)
  }

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const deleteFile = async (fileId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    const supabase = createClient()

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("medical-files").remove([filePath])

    if (storageError) {
      console.error("Failed to delete from storage:", storageError)
      return
    }

    // Delete from database
    const { error: dbError } = await supabase.from("file_attachments").delete().eq("id", fileId)

    if (dbError) {
      console.error("Failed to delete from database:", dbError)
      return
    }

    // Refresh files list
    fetchFiles()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType === "application/pdf") return "📄"
    if (fileType.includes("word")) return "📝"
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊"
    return "📎"
  }

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith("image/")) return "bg-blue-100 text-blue-800"
    if (fileType === "application/pdf") return "bg-red-100 text-red-800"
    if (fileType.includes("word")) return "bg-blue-100 text-blue-800"
    if (fileType.includes("excel")) return "bg-green-100 text-green-800"
    return "bg-gray-100 text-gray-800"
  }

  const toggleAnalyzer = (fileId: string) => {
    setExpandedAnalyzer(expandedAnalyzer === fileId ? null : fileId)
  }

  const handleAnalysisComplete = (fileId: string, analysis: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file: any) =>
        file.id === fileId ? { ...file, ai_analysis: analysis, analyzed_at: new Date().toISOString() } : file,
      ),
    )
  }

  const canAnalyzeFile = (fileType: string) => {
    return (
      fileType === "application/pdf" ||
      fileType.startsWith("image/") ||
      fileType.includes("word") ||
      fileType.includes("text")
    )
  }

  const filteredFiles = files.filter((file: any) => file.file_name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">Patient Files</CardTitle>
        <CardDescription>Medical documents, images, and other patient files with AI analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search files by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {/* Files List */}
          {filteredFiles.length > 0 ? (
            <div className="space-y-3">
              {filteredFiles.map((file: any) => (
                <div key={file.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{file.file_name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getFileTypeColor(file.file_type)}>{file.file_type.split("/")[1]}</Badge>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                          {file.ai_analysis && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Brain className="w-3 h-3 mr-1" />
                              AI Analyzed
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Uploaded by {file.profiles?.full_name} on {new Date(file.created_at).toLocaleDateString()}
                        </div>
                        {file.description && <p className="text-sm text-muted-foreground mt-2">{file.description}</p>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => downloadFile(file.file_url, file.file_name)}>
                        Download
                      </Button>
                      {file.file_type.startsWith("image/") && (
                        <Button size="sm" variant="outline" onClick={() => window.open(file.file_url, "_blank")}>
                          View
                        </Button>
                      )}
                      {canAnalyzeFile(file.file_type) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAnalyzer(file.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          {expandedAnalyzer === file.id ? (
                            <>
                              <ChevronUp className="w-3 h-3 ml-1" />
                            </>
                          ) : (
                            <>
                              Analyze
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteFile(file.id, file.file_url.split("/").pop())}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {expandedAnalyzer === file.id && canAnalyzeFile(file.file_type) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <DocumentAnalyzer
                        fileUrl={file.file_url}
                        fileName={file.file_name}
                        onAnalysisComplete={(analysis) => handleAnalysisComplete(file.id, analysis)}
                      />
                    </div>
                  )}

                  {file.ai_analysis && expandedAnalyzer !== file.id && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-bold text-blue-900 flex items-center">
                          <Brain className="w-5 h-5 mr-2" />
                          🤖 AI Analysis Summary
                          <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-700 px-3 py-1">
                            {file.analysis_type || 'general'}
                          </Badge>
                        </h5>
                        <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                          📅 {new Date(file.analyzed_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Enhanced Structured Analysis Display */}
                      <div className="space-y-3">
                        {file.ai_analysis.split('\n').slice(0, 4).map((line: string, index: number) => {
                          const trimmedLine = line.trim()
                          if (trimmedLine) {
                            // Handle main headers with emojis
                            if (trimmedLine.match(/^[📋🔬💊🔍📄]/)) {
                              return (
                                <div key={index} className="bg-white bg-opacity-80 p-3 rounded-lg border border-blue-300 shadow-sm">
                                  <h4 className="font-bold text-blue-900 text-base">{parseMarkdownText(trimmedLine)}</h4>
                                </div>
                              )
                            }
                            // Handle numbered items
                            if (isNumberedItem(trimmedLine)) {
                              const number = extractNumber(trimmedLine)
                              const content = extractNumberedContent(trimmedLine)
                              return (
                                <div key={index} className="flex items-start space-x-3 bg-white bg-opacity-60 p-3 rounded-lg">
                                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {number}
                                  </span>
                                  <p className="text-blue-800 font-medium leading-relaxed">
                                    {parseMarkdownText(content)}
                                  </p>
                                </div>
                              )
                            }
                            // Regular content
                            return (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mt-1.5 flex-shrink-0 shadow-sm" />
                                <p className="text-blue-800 leading-relaxed font-medium">{parseMarkdownText(trimmedLine)}</p>
                              </div>
                            )
                          }
                          return null
                        })}
                        
                        {file.ai_analysis.split('\n').length > 4 && (
                          <div className="pt-3 border-t border-blue-200">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => toggleAnalyzer(file.id)}
                              className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 font-medium"
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              📖 View Complete Analysis
                              <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-blue-200">
                        <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-50">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          📋 Copy
                        </Button>
                        <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-50">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          💾 Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📁</div>
              <h3 className="text-lg font-serif font-medium text-foreground mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No files match your search criteria." : "No files have been uploaded yet."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
