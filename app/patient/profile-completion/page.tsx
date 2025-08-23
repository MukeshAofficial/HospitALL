"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  Pill, 
  AlertTriangle, 
  Shield,
  Plus,
  X,
  ArrowRight,
  UserCheck
} from "lucide-react"

export default function PatientProfileCompletionPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    // Basic Information
    phone: "",
    dateOfBirth: "",
    gender: "",
    
    // Medical Information
    bloodType: "",
    allergies: [] as string[],
    currentMedications: [] as string[],
    medicalHistory: "",
    
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    
    // Insurance (Optional)
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceGroupNumber: ""
  })

  const [newAllergy, setNewAllergy] = useState("")
  const [newMedication, setNewMedication] = useState("")

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }
      
      setUser(user)
      
      // Check if profile already exists with complete data
      const { data: patient } = await supabase
        .from('patients')
        .select('*, profiles!inner(*)')
        .eq('profile_id', user.id)
        .single()
        
      if (patient && patient.date_of_birth && patient.emergency_contact_name) {
        // Profile already complete, redirect to hospital selection
        router.push("/select-hospital")
        return
      }
      
      // Pre-fill with existing data if any
      if (patient) {
        setFormData(prev => ({
          ...prev,
          phone: patient.profiles.phone || "",
          dateOfBirth: patient.date_of_birth || "",
          gender: patient.gender || "",
          bloodType: patient.blood_type || "",
          allergies: patient.allergies || [],
          currentMedications: patient.current_medications || [],
          medicalHistory: patient.medical_history || "",
          emergencyContactName: patient.emergency_contact_name || "",
          emergencyContactPhone: patient.emergency_contact_phone || ""
        }))
      }
    }
    
    getUser()
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy("")
    }
  }

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }))
  }

  const addMedication = () => {
    if (newMedication.trim() && !formData.currentMedications.includes(newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, newMedication.trim()]
      }))
      setNewMedication("")
    }
  }

  const removeMedication = (medication: string) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(m => m !== medication)
    }))
  }

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      if (!user) throw new Error("User not found")

      // Update profile with phone
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone: formData.phone })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update or insert patient data
      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          profile_id: user.id,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          blood_type: formData.bloodType,
          allergies: formData.allergies,
          current_medications: formData.currentMedications,
          medical_history: formData.medicalHistory,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          insurance_info: {
            provider: formData.insuranceProvider,
            policy_number: formData.insurancePolicyNumber,
            group_number: formData.insuranceGroupNumber
          }
        }, {
          onConflict: 'profile_id'
        })

      if (patientError) throw patientError

      // Redirect to hospital selection
      router.push("/select-hospital")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      console.error('Error saving profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.phone && formData.dateOfBirth && formData.gender
      case 2:
        return formData.emergencyContactName && formData.emergencyContactPhone
      case 3:
        return true // Medical info is optional, but step should be completed
      default:
        return false
    }
  }

  const steps = [
    { number: 1, title: "Basic Information", icon: User },
    { number: 2, title: "Emergency Contact", icon: Shield },
    { number: 3, title: "Medical History", icon: Heart }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <UserCheck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">We need some basic information to provide you with the best healthcare experience</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isActive = step.number === currentStep
              const isComplete = isStepComplete(step.number) && step.number < currentStep
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isComplete 
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                      Step {step.number}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${isComplete ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 text-center">
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Emergency Contact */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      placeholder="Enter emergency contact name"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      placeholder="Enter emergency contact phone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Insurance Information (Optional) */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Insurance Information (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input
                        id="insuranceProvider"
                        placeholder="e.g., Blue Cross Blue Shield"
                        value={formData.insuranceProvider}
                        onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                      <Input
                        id="insurancePolicyNumber"
                        placeholder="Enter policy number"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => handleInputChange("insurancePolicyNumber", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Medical History */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => handleInputChange("bloodType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Allergies */}
                <div className="space-y-3">
                  <Label>Allergies</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add an allergy"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                    />
                    <Button type="button" variant="outline" onClick={addAllergy}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.allergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{allergy}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeAllergy(allergy)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Medications */}
                <div className="space-y-3">
                  <Label>Current Medications</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a medication"
                      value={newMedication}
                      onChange={(e) => setNewMedication(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                    />
                    <Button type="button" variant="outline" onClick={addMedication}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.currentMedications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.currentMedications.map((medication, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{medication}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeMedication(medication)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medical History */}
                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    placeholder="Please describe any significant medical conditions, surgeries, or chronic illnesses..."
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepComplete(currentStep)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.emergencyContactName || !formData.emergencyContactPhone}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Saving...' : 'Complete Profile'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your information is secure and will only be shared with your healthcare providers.
          </p>
        </div>
      </div>
    </div>
  )
}