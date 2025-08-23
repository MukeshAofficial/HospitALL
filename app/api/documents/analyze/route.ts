import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileUrl, fileName, analysisType = "general" } = await request.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 })
    }

    // Fetch the file content
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 400 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString("base64")

    // Determine file type
    const mimeType = fileResponse.headers.get("content-type") || "application/pdf"

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let prompt = ""
    switch (analysisType) {
      case "medical":
        prompt = `Analyze this medical document and provide a comprehensive summary including:
        1. Document Type (lab results, prescription, medical report, etc.)
        2. Key Findings or Results
        3. Important Values or Measurements
        4. Recommendations or Next Steps
        5. Any Concerning Items that need attention
        
        Please format the response in a clear, structured manner that a patient can easily understand.`
        break
      case "lab":
        prompt = `Analyze this lab report and provide:
        1. Test Types Performed
        2. Results Summary (normal/abnormal values)
        3. Reference Ranges
        4. Clinical Significance
        5. Recommendations for follow-up
        
        Explain any abnormal values in simple terms.`
        break
      case "prescription":
        prompt = `Analyze this prescription and provide:
        1. Medications Listed
        2. Dosages and Instructions
        3. Purpose of each medication
        4. Important warnings or side effects
        5. Duration of treatment
        
        Present in patient-friendly language.`
        break
      default:
        prompt = `Analyze this document and provide a clear, comprehensive summary of its contents. Focus on key information that would be important for a patient to understand about their healthcare.`
    }

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      prompt,
    ])

    const analysis = result.response.text()

    // Store the analysis in the database
    const { data: analysisRecord, error: dbError } = await supabase
      .from("file_attachments")
      .update({
        ai_analysis: analysis,
        analysis_type: analysisType,
        analyzed_at: new Date().toISOString(),
      })
      .eq("file_url", fileUrl)
      .eq("uploaded_by", user.id)
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Still return the analysis even if DB update fails
    }

    return NextResponse.json({
      success: true,
      analysis,
      analysisType,
      fileName,
    })
  } catch (error) {
    console.error("Document analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 })
  }
}
