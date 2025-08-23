import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Mock Deepgram transcription (replace with actual Deepgram API)
async function transcribeWithDeepgram(audioBuffer: ArrayBuffer): Promise<string> {
  // In a real implementation, you would use the Deepgram SDK:
  // const deepgram = createClient(process.env.DEEPGRAM_API_KEY)
  // const response = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
  //   model: "nova-2",
  //   language: "en-US",
  //   smart_format: true,
  // })
  // return response.result.channels[0].alternatives[0].transcript

  // Mock transcription for demo
  return "Patient reports experiencing chest pain for the past two days. Pain is described as sharp and occurs mainly during physical activity. No shortness of breath or dizziness reported. Patient has a history of hypertension and is currently taking lisinopril 10mg daily. Vital signs are stable with blood pressure 140/90, heart rate 78 bpm. Recommend ECG and chest X-ray. Continue current medication and follow up in one week."
}

// Mock Google Gemini structured notes generation (replace with actual Gemini API)
async function generateStructuredNotes(transcription: string): Promise<any> {
  // In a real implementation, you would use the Google Gemini API:
  // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  // const model = genAI.getGenerativeModel({ model: "gemini-pro" })
  // const prompt = `Convert this medical transcription into structured notes: ${transcription}`
  // const result = await model.generateContent(prompt)
  // return JSON.parse(result.response.text())

  // Mock structured notes for demo
  return {
    chief_complaint: "Chest pain for 2 days",
    symptoms: ["Sharp chest pain during physical activity", "No shortness of breath", "No dizziness"],
    assessment: "Chest pain, likely musculoskeletal vs cardiac etiology. Patient has history of hypertension.",
    plan: "Order ECG and chest X-ray, continue current antihypertensive medication",
    medications: ["Lisinopril 10mg daily (continue)"],
    follow_up: "Return in 1 week for results review and reassessment",
    vital_signs: {
      blood_pressure: "140/90 mmHg",
      heart_rate: "78 bpm",
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is healthcare professional
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "doctor", "nurse"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const patientId = formData.get("patientId") as string
    const appointmentId = formData.get("appointmentId") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert audio file to buffer
    const audioBuffer = await audioFile.arrayBuffer()

    // Transcribe audio using Deepgram
    const transcription = await transcribeWithDeepgram(audioBuffer)

    // Generate structured notes using Google Gemini
    const structuredNotes = await generateStructuredNotes(transcription)

    // Save to database
    const { data: voiceRecord, error: dbError } = await supabase
      .from("voice_transcriptions")
      .insert({
        patient_id: patientId,
        doctor_id: user.id,
        appointment_id: appointmentId || null,
        raw_transcription: transcription,
        structured_notes: structuredNotes,
        processing_status: "completed",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save transcription" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transcription,
      structuredNotes,
      recordId: voiceRecord.id,
    })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}
