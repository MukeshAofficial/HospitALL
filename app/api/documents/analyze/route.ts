import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
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
        prompt = `As a medical AI assistant, analyze this medical document and provide a comprehensive, patient-friendly summary:
        
        📋 **DOCUMENT ANALYSIS**
        1. Document Type: Identify the type of medical document
        2. Key Findings: Summarize the most important medical findings
        3. Critical Values: Highlight any abnormal or concerning measurements
        4. Recommendations: List any medical recommendations or next steps
        5. Follow-up Care: Identify any required follow-up appointments or tests
        6. Patient Action Items: What the patient should do or watch for
        
        Format your response clearly with headers and bullet points. Use simple medical terminology that patients can understand.`
        break
      case "lab":
        prompt = `Analyze this laboratory report as a medical AI and provide:
        
        🔬 **LAB RESULTS ANALYSIS**
        1. Tests Performed: List all tests conducted
        2. Normal vs. Abnormal: Categorize results (🟢 Normal, 🟡 Borderline, 🔴 Abnormal)
        3. Reference Ranges: Include normal ranges for context
        4. Clinical Significance: Explain what abnormal values might indicate
        5. Trending: If multiple tests, note any patterns or trends
        6. Recommendations: Suggest follow-up actions or lifestyle changes
        
        Use clear formatting and explain medical terms in patient-friendly language.`
        break
      case "prescription":
        prompt = `Analyze this prescription document and provide:
        
        💊 **PRESCRIPTION ANALYSIS**
        1. Medications Listed: All prescribed medications with generic names
        2. Dosage & Instructions: Clear dosing schedule and administration
        3. Purpose: Why each medication was prescribed
        4. Duration: How long to take each medication
        5. Important Warnings: Key side effects and contraindications
        6. Drug Interactions: Notable interactions to be aware of
        7. Patient Tips: Helpful reminders for taking medications safely
        
        Present information in a clear, organized format that patients can reference easily.`
        break
      case "imaging":
        prompt = `Analyze this medical imaging report and provide:
        
        🔍 **IMAGING ANALYSIS**
        1. Imaging Type: Type of scan or imaging study performed
        2. Areas Examined: Anatomical regions studied
        3. Key Findings: Important observations from the imaging
        4. Normal Structures: What appears normal
        5. Abnormalities: Any concerning findings (explained simply)
        6. Clinical Correlation: How findings relate to symptoms
        7. Next Steps: Recommended follow-up or additional imaging
        
        Explain findings in patient-friendly terms while maintaining accuracy.`
        break
      default:
        prompt = `Analyze this healthcare document and provide a comprehensive, patient-centered summary:
        
        📄 **DOCUMENT SUMMARY**
        1. Document Purpose: What this document is for
        2. Key Information: Most important points for the patient
        3. Medical Terms: Simplified explanations of complex terms
        4. Action Items: What the patient should do next
        5. Questions to Ask: Suggested questions for healthcare providers
        6. Important Notes: Critical information to remember
        
        Use clear, compassionate language that helps patients understand their healthcare information.`
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
