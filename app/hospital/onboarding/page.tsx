"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "",
    phone: "",
    department: "",
    specialization: "",
    licenseNumber: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hospitalInfo, setHospitalInfo] = useState<{ id: string; name: string } | null>(null)
  const [isCheckingHospital, setIsCheckingHospital] = useState(false)

  // Check hospital association on page load
  useEffect(() => {
    checkAndAssociateHospital()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const checkAndAssociateHospital = async () => {
    setIsCheckingHospital(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/admin/associate-hospital', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to associate hospital')
      }

      setHospitalInfo({
        id: result.hospital_id,
        name: result.hospital_name
      })

      setMessage({
        type: "success",
        text: result.message
      })

    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to associate hospital"
      })
    } finally {
      setIsCheckingHospital(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      
      // Get current user's session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Call our API route for staff creation
      const response = await fetch('/api/staff/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          department: formData.department,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          notes: formData.notes
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create staff account')
      }

      setMessage({
        type: "success",
        text: result.message,
      })
      setFormData({
        email: "",
        fullName: "",
        role: "",
        phone: "",
        department: "",
        specialization: "",
        licenseNumber: "",
        notes: "",
      })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to create account",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground">Staff Onboarding</h1>
          <p className="text-muted-foreground mt-2">Add new healthcare professionals to your team</p>
        </div>

        {/* Hospital Association Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Hospital Association</CardTitle>
            <CardDescription>Ensure you are associated with a hospital before creating staff accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {hospitalInfo ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✓ Associated with: <strong>{hospitalInfo.name}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    ⚠️ You need to be associated with a hospital to create staff accounts.
                  </p>
                </div>
                <Button 
                  onClick={checkAndAssociateHospital}
                  disabled={isCheckingHospital}
                  className="w-full"
                >
                  {isCheckingHospital ? 'Checking Hospital Association...' : 'Setup Hospital Association'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Form */}
        {hospitalInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">New Staff Member</CardTitle>
              <CardDescription>Fill out the information below to create a new staff account</CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    placeholder="e.g., Cardiology, Emergency"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                    placeholder="e.g., Pediatric Cardiology"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                    placeholder="Enter medical license number"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information or notes"
                    rows={3}
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({
                      email: "",
                      fullName: "",
                      role: "",
                      phone: "",
                      department: "",
                      specialization: "",
                      licenseNumber: "",
                      notes: "",
                    })
                  }
                >
                  Clear Form
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Staff Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Onboarding Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Onboarding Checklist</CardTitle>
            <CardDescription>Steps to complete after creating a staff account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Send welcome email with login credentials",
                "Schedule orientation session",
                "Provide access to hospital systems",
                "Assign mentor or supervisor",
                "Complete required training modules",
                "Set up department-specific access",
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-4 h-4 border border-border rounded"></div>
                  <span className="text-sm text-card-foreground">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
