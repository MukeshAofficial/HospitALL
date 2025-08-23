"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useRef, useState } from "react"
import { Mic, Square, Loader2 } from "lucide-react"

interface VoiceRecorderProps {
  patientId?: string
  appointmentId?: string
  onTranscriptionComplete?: (transcription: any) => void
}

export function VoiceRecorder({ patientId, appointmentId, onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcription, setTranscription] = useState("")
  const [structuredNotes, setStructuredNotes] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      // Clean up audio context safely
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Clean up any existing audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close()
      }

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      monitorAudioLevel()

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setError("Failed to start recording. Please check microphone permissions.")
      console.error("Recording error:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      // Close audio context safely
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setAudioLevel(Math.min(100, (average / 128) * 100))

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")
      if (patientId) formData.append("patientId", patientId)
      if (appointmentId) formData.append("appointmentId", appointmentId)

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process audio")
      }

      const result = await response.json()
      setTranscription(result.transcription)
      setStructuredNotes(result.structuredNotes)

      if (onTranscriptionComplete) {
        onTranscriptionComplete(result)
      }
    } catch (err) {
      setError("Failed to process audio recording")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-serif">Voice Recording</CardTitle>
          <CardDescription>Record and transcribe medical consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recording Status */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div
                  className={`w-4 h-4 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300"}`}
                ></div>
                <span className="text-2xl font-mono">{formatTime(recordingTime)}</span>
              </div>

              {/* Audio Level Indicator */}
              {isRecording && (
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Audio Level</div>
                  <Progress value={audioLevel} className="w-full" />
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center space-x-3">
                {!isRecording && !isProcessing ? (
                  <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : isRecording ? (
                  <Button onClick={stopRecording} variant="outline">
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </Button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">{error}</div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Processing audio and generating structured notes...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcription Results */}
      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Raw Transcription</CardTitle>
            <CardDescription>Direct speech-to-text output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{transcription}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Structured Notes */}
      {structuredNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Structured Medical Notes</CardTitle>
            <CardDescription>AI-generated structured summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {structuredNotes.chief_complaint && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Chief Complaint:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{structuredNotes.chief_complaint}</p>
                </div>
              )}

              {structuredNotes.symptoms && structuredNotes.symptoms.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Symptoms:</h4>
                  <ul className="text-sm space-y-1">
                    {structuredNotes.symptoms.map((symptom: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {structuredNotes.assessment && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Assessment:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{structuredNotes.assessment}</p>
                </div>
              )}

              {structuredNotes.plan && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Treatment Plan:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{structuredNotes.plan}</p>
                </div>
              )}

              {structuredNotes.medications && structuredNotes.medications.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Medications:</h4>
                  <ul className="text-sm space-y-1">
                    {structuredNotes.medications.map((medication: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-chart-3 rounded-full mr-2"></span>
                        {medication}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {structuredNotes.follow_up && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Follow-up:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{structuredNotes.follow_up}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
