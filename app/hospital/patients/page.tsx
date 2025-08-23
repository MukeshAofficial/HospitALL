"use client"

import { HospitalLayout } from "@/components/hospital-layout"
import { PatientDetailView } from "@/components/patient-detail-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, Search, Plus, Eye, Edit, UserPlus } from "lucide-react"

interface Patient {
  id: string
  date_of_birth?: string
  gender?: string
  blood_type?: string
  allergies?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_history?: string
  current_medications?: string[]
  insurance_info?: any
  created_at: string
  profiles: {
    full_name: string
    email: string
    phone?: string
    avatar_url?: string
  }
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("patients")
        .select(
          `
          *,
          profiles!inner(full_name, email, phone, avatar_url)
        `,
        )
        .order("created_at", { ascending: false })

      if (!error && data) {
        setPatients(data)
      }
      setIsLoading(false)
    }

    fetchPatients()
  }, [])

  const handleViewDetails = async (patient: any) => {
    const supabase = createClient()
    
    // Fetch additional patient data for detailed view
    const [appointmentsResult, recordsResult, filesResult] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: false }),
      
      supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      
      supabase
        .from("file_attachments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
    ])

    const detailedPatient = {
      id: patient.id,
      profile: {
        full_name: patient.profiles.full_name,
        email: patient.profiles.email,
        phone: patient.profiles.phone,
        avatar_url: patient.profiles.avatar_url
      },
      patient_info: {
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        blood_type: patient.blood_type,
        allergies: patient.allergies,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone,
        medical_history: patient.medical_history,
        current_medications: patient.current_medications,
        insurance_info: patient.insurance_info
      },
      appointments: appointmentsResult.data || [],
      medical_records: recordsResult.data || [],
      files: filesResult.data || []
    }

    setSelectedPatient(detailedPatient)
    setIsDetailViewOpen(true)
  }

  const filteredPatients = patients.filter((patient: any) =>
    patient.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <HospitalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </HospitalLayout>
    )
  }

  return (
    <HospitalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
              <p className="text-gray-600 mt-1">Manage and view all registered patients</p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/hospital/patients/new" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Patient</span>
            </Link>
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter((p: any) => 
                      new Date(p.created_at).getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Male Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter((p: any) => p.gender === 'male').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Female Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter((p: any) => p.gender === 'female').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-600" />
              <span>Search Patients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient: any) => (
              <Card key={patient.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900">{patient.profiles.full_name}</CardTitle>
                  <CardDescription className="text-gray-600">{patient.profiles.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">{patient.profiles.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <p className="font-medium capitalize">{patient.gender || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Blood Type:</span>
                        <p className="font-medium">{patient.blood_type || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Age:</span>
                        <p className="font-medium">
                          {patient.date_of_birth 
                            ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
                            : "N/A"
                          }
                        </p>
                      </div>
                    </div>
                    {patient.allergies && patient.allergies.length > 0 && (
                      <div>
                        <span className="text-gray-500">Allergies:</span>
                        <p className="text-xs text-orange-600 font-medium">
                          {patient.allergies.slice(0, 2).join(", ")}
                          {patient.allergies.length > 2 && " +more"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewDetails(patient)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>
                    <Button size="sm" asChild className="flex items-center space-x-1">
                      <Link href={`/hospital/patients/${patient.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No patients match your search criteria." : "Get started by adding your first patient."}
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/hospital/patients/new" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add First Patient</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Patient Detail View Modal */}
        {selectedPatient && (
          <PatientDetailView
            patient={selectedPatient}
            isOpen={isDetailViewOpen}
            onClose={() => {
              setIsDetailViewOpen(false)
              setSelectedPatient(null)
            }}
            onEdit={(patient) => {
              // Navigate to edit page
              window.location.href = `/hospital/patients/${patient.id}/edit`
            }}
          />
        )}
      </div>
    </HospitalLayout>
  )
}
