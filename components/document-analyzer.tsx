"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, Brain, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseMarkdownText, isMarkdownHeader, isNumberedItem, isBulletPoint, extractNumber, extractNumberedContent, extractBulletContent } from "@/lib/utils/markdown-parser"

interface DocumentAnalyzerProps {
  fileUrl: string
  fileName: string
  onAnalysisComplete?: (analysis: string) => void
}

export function DocumentAnalyzer({ fileUrl, fileName, onAnalysisComplete }: DocumentAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisType, setAnalysisType] = useState("general")
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl,
          fileName,
          analysisType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze document")
      }

      setAnalysis(data.analysis)
      onAnalysisComplete?.(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Document Analysis
        </CardTitle>
        <CardDescription>Get an AI-powered summary and analysis of your medical document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          {fileName}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Analysis Type</label>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Analysis</SelectItem>
              <SelectItem value="medical">Medical Report</SelectItem>
              <SelectItem value="lab">Lab Results</SelectItem>
              <SelectItem value="prescription">Prescription</SelectItem>
              <SelectItem value="imaging">Imaging Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Document...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Analyze Document
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Brain className="h-5 w-5 text-blue-600 mr-2" />
                AI Analysis Results
              </CardTitle>
              <CardDescription>
                Analysis Type: <span className="font-medium capitalize">{analysisType}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enhanced Formatted Analysis */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                  <div className="prose prose-sm max-w-none text-gray-800">
                    {analysis.split('\n').map((line, index) => {
                      const trimmedLine = line.trim()
                      
                      // Skip empty lines
                      if (!trimmedLine) {
                        return <div key={index} className="h-3" />
                      }
                      
                      // Function to parse markdown formatting is now imported
                      
                      // Handle main headers with emojis
                      if (trimmedLine.match(/^[📋🔬💊🔍📄]/) || isMarkdownHeader(trimmedLine)) {
                        return (
                          <div key={index} className="bg-white bg-opacity-70 p-4 rounded-lg border border-blue-300 shadow-sm mb-4">
                            <h3 className="text-xl font-bold text-blue-900 flex items-center">
                              {parseMarkdownText(trimmedLine)}
                            </h3>
                          </div>
                        )
                      }
                      
                      // Handle numbered items (1. 2. 3. etc)
                      if (isNumberedItem(trimmedLine)) {
                        const number = extractNumber(trimmedLine)
                        const content = extractNumberedContent(trimmedLine)
                        return (
                          <div key={index} className="bg-white bg-opacity-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <h4 className="font-semibold text-blue-800 flex items-start">
                              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5 flex-shrink-0">
                                {number}
                              </span>
                              <span className="flex-1">{parseMarkdownText(content)}</span>
                            </h4>
                          </div>
                        )
                      }
                      
                      // Handle bullet points
                      if (isBulletPoint(trimmedLine)) {
                        const bulletText = extractBulletContent(trimmedLine)
                        return (
                          <div key={index} className="flex items-start mb-2 ml-4">
                            <span className="bg-blue-500 rounded-full w-2 h-2 mt-2 mr-3 flex-shrink-0"></span>
                            <p className="text-blue-800 leading-relaxed">{parseMarkdownText(bulletText)}</p>
                          </div>
                        )
                      }
                      
                      // Handle special status indicators
                      if (trimmedLine.includes('🟢') || trimmedLine.includes('🟡') || trimmedLine.includes('🔴')) {
                        return (
                          <div key={index} className="flex items-center p-2 bg-white bg-opacity-60 rounded-lg border border-blue-200 mb-2">
                            <p className="text-blue-800 font-medium">{parseMarkdownText(trimmedLine)}</p>
                          </div>
                        )
                      }
                      
                      // Regular paragraphs
                      return (
                        <p key={index} className="mb-3 leading-relaxed text-blue-900 pl-2">
                          {parseMarkdownText(trimmedLine)}
                        </p>
                      )
                    })}
                  </div>
                </div>
                
                {/* Enhanced Analysis Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                    <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      ✨ Analysis Complete
                    </h5>
                    <p className="text-sm text-green-700 leading-relaxed">
                      Your document has been thoroughly analyzed using advanced AI technology for comprehensive insights.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                    <h5 className="font-semibold text-amber-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      ⚠️ Medical Disclaimer
                    </h5>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      This analysis is for informational purposes only. Always consult your healthcare provider for medical decisions.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200 shadow-sm">
                    <h5 className="font-semibold text-purple-800 mb-2 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      🤖 AI Powered
                    </h5>
                    <p className="text-sm text-purple-700 leading-relaxed">
                      Analyzed using Google Gemini AI with specialized medical knowledge and understanding.
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-blue-200">
                  <Button variant="outline" size="sm" className="flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Analysis
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Save Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
