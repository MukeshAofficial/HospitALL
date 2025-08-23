"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Building2, MapPin, Phone, Users, CheckCircle } from "lucide-react"

interface Hospital {
  id: string
  name: string
  address?: string
  city: string
  state: string
  phone?: string
  description?: string
}

export default function HospitalSelectionPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setHospitals(data || [])
    } catch (err) {
      setError('Failed to load hospitals')
      console.error('Error fetching hospitals:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHospitalSelection = async () => {
    if (!selectedHospital) {
      setError('Please select a hospital')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not found')
      }

      // Update patient record with selected hospital
      const { error: updateError } = await supabase
        .from('patients')
        .update({ hospital_id: selectedHospital })
        .eq('profile_id', user.id)

      if (updateError) throw updateError

      // Redirect to patient dashboard
      router.push('/patient')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select hospital')
      console.error('Error selecting hospital:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Your Hospital</h1>
          <p className="text-gray-600">Choose the hospital where you want to receive care</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {hospitals.map((hospital) => (
            <Card 
              key={hospital.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedHospital === hospital.id 
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                  : 'hover:border-blue-300'
              }`}
              onClick={() => setSelectedHospital(hospital.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {hospital.name}
                  </CardTitle>
                  {selectedHospital === hospital.id && (
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hospital.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p>{hospital.address}</p>
                      <p>{hospital.city}, {hospital.state}</p>
                    </div>
                  </div>
                )}

                {hospital.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{hospital.phone}</span>
                  </div>
                )}

                {hospital.description && (
                  <p className="text-sm text-gray-600">{hospital.description}</p>
                )}

                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Available for appointments
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {hospitals.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Hospitals Available</h3>
            <p className="text-gray-600">Please contact support to add hospitals to the system.</p>
          </div>
        )}

        {hospitals.length > 0 && (
          <div className="text-center">
            <Button
              onClick={handleHospitalSelection}
              disabled={!selectedHospital || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming Selection...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </Button>
            
            {selectedHospital && (
              <p className="text-sm text-gray-600 mt-3">
                You selected: <span className="font-medium">
                  {hospitals.find(h => h.id === selectedHospital)?.name}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact{" "}
            <a href="mailto:support@hospitall.com" className="text-blue-600 hover:underline">
              support@hospitall.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}