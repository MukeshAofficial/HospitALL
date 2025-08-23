"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Building2, Heart } from "lucide-react"

interface Hospital {
  id: string
  name: string
  city: string
  state: string
}

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    role: "",
    dateOfBirth: "",
    gender: "",
    hospitalName: "",
    hospitalAddress: "",
    hospitalCity: "",
    hospitalState: "",
    hospitalZip: "",
    hospitalPhone: "",
    existingHospitalId: "",
  })
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (formData.role === 'patient') {
      fetchHospitals()
    }
  }, [formData.role])

  const fetchHospitals = async () => {
    setIsLoadingHospitals(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, city, state')
      .eq('status', 'active')
      .order('name')
    
    if (!error && data) {
      setHospitals(data)
    }
    setIsLoadingHospitals(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/api/auth/callback`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
          },
        },
      })
      
      if (authError) throw authError

      // If admin/doctor/nurse, create hospital first
      let hospitalId = formData.existingHospitalId
      
      if ((formData.role === 'admin' || formData.role === 'doctor' || formData.role === 'nurse') && formData.hospitalName) {
        const { data: hospitalData, error: hospitalError } = await supabase
          .from('hospitals')
          .insert({
            name: formData.hospitalName,
            address: formData.hospitalAddress,
            city: formData.hospitalCity,
            state: formData.hospitalState,
            zip_code: formData.hospitalZip,
            phone: formData.hospitalPhone,
            admin_id: authData.user?.id,
            status: 'active'
          })
          .select()
          .single()
        
        if (hospitalError) throw hospitalError
        hospitalId = hospitalData.id
      }

      router.push("/auth/verify")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Join HospitALL</CardTitle>
            <CardDescription className="text-gray-600">Create your healthcare account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              {formData.role === "patient" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {(formData.role === 'admin' || formData.role === 'doctor' || formData.role === 'nurse') && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Hospital Information</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hospitalName">Hospital Name</Label>
                    <Input
                      id="hospitalName"
                      type="text"
                      placeholder="Enter hospital name"
                      value={formData.hospitalName}
                      onChange={(e) => handleInputChange("hospitalName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospitalAddress">Hospital Address</Label>
                    <Textarea
                      id="hospitalAddress"
                      placeholder="Enter hospital address"
                      value={formData.hospitalAddress}
                      onChange={(e) => handleInputChange("hospitalAddress", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="hospitalCity">City</Label>
                      <Input
                        id="hospitalCity"
                        type="text"
                        placeholder="City"
                        value={formData.hospitalCity}
                        onChange={(e) => handleInputChange("hospitalCity", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospitalState">State</Label>
                      <Input
                        id="hospitalState"
                        type="text"
                        placeholder="State"
                        value={formData.hospitalState}
                        onChange={(e) => handleInputChange("hospitalState", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="hospitalZip">ZIP Code</Label>
                      <Input
                        id="hospitalZip"
                        type="text"
                        placeholder="ZIP Code"
                        value={formData.hospitalZip}
                        onChange={(e) => handleInputChange("hospitalZip", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospitalPhone">Hospital Phone</Label>
                      <Input
                        id="hospitalPhone"
                        type="tel"
                        placeholder="Hospital phone"
                        value={formData.hospitalPhone}
                        onChange={(e) => handleInputChange("hospitalPhone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'patient' && (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Heart className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-900">Select Hospital</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="existingHospitalId">Choose Hospital</Label>
                    <Select 
                      value={formData.existingHospitalId} 
                      onValueChange={(value) => handleInputChange("existingHospitalId", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingHospitals ? "Loading hospitals..." : "Select a hospital"} />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital: any) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.city}, {hospital.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
