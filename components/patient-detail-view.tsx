"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Heart, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Clock,
  Activity,
  Shield,
  UserCheck,
  Edit3,
  Download,
  Eye
} from "lucide-react"

interface PatientData {
  id: string
  profile: {
    full_name: string
    email: string
    phone?: string
    avatar_url?: string
  }
  patient_info: {
    date_of_birth: string
    gender: string
    blood_type?: string
    allergies?: string[]
    emergency_contact_name?: string
    emergency_contact_phone?: string
    medical_history?: string
    current_medications?: string[]
    insurance_info?: any
  }
  appointments?: any[]
  medical_records?: any[]
  files?: any[]
}

interface PatientDetailViewProps {
  patient: PatientData
  isOpen: boolean
  onClose: () => void
  onEdit?: (patient: PatientData) => void
}

export function PatientDetailView({ patient, isOpen, onClose, onEdit }: PatientDetailViewProps) {
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-emerald-100 text-emerald-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{patient.profile.full_name}</h2>
                <p className="text-gray-600 text-sm">Patient ID: {patient.id.slice(0, 8)}</p>
              </div>
            </DialogTitle>
            <Button onClick={() => onEdit?.(patient)} variant="outline" size="sm" className="flex-shrink-0">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Patient
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="medical" className="text-xs sm:text-sm">Medical</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs sm:text-sm">Appointments</TabsTrigger>
            <TabsTrigger value="records" className="text-xs sm:text-sm hidden sm:block">Records</TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm hidden sm:block">Files</TabsTrigger>
          </TabsList>
          
          {/* Mobile dropdown for hidden tabs */}
          <div className="sm:hidden mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
              <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 px-2">
            <div className="mx-auto w-full max-w-5xl space-y-8">
              <Card className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Personal Information Section (no nested card) */}
                    <div className="lg:col-span-2">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-6 w-6 text-blue-600" />
                          <h3 className="text-xl font-semibold">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        
                        </div>

                        {/* Date of Birth - Full Width Bottom Section */}
                        <div>
                          <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
                            <Calendar className="h-7 w-7 text-blue-500 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-600 mb-2">Date of Birth</p>
                              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                                <p className="font-medium text-gray-900 text-lg">
                                  {formatDate(patient.patient_info.date_of_birth)}
                                </p>
                                <span className="text-lg text-blue-600 font-semibold px-4 py-2 bg-blue-100 rounded-full">
                                  Age: {calculateAge(patient.patient_info.date_of_birth)} years
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact Section (no nested card) */}
                    <div className="lg:col-span-1">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-6 w-6 text-red-600" />
                          <h3 className="text-xl font-semibold">Emergency Contact</h3>
                        </div>
                        {patient.patient_info.emergency_contact_name ? (
                          <div className="flex items-start space-x-4 p-5 bg-red-50 rounded-xl border border-red-200 w-full">
                            <User className="h-6 w-6 text-red-500 mt-1.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-red-600 mb-1">Contact Name</p>
                              <p className="font-medium text-gray-900 text-lg truncate" title={patient.patient_info.emergency_contact_name}>
                                {patient.patient_info.emergency_contact_name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center w-full">
                            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 italic font-medium">No emergency contact information available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Statistics Section inside the same container */}
                  <div className="mt-10">
                    <h3 className="text-xl font-semibold mb-4">Patient Statistics</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">Total Appointments</p>
                            <p className="text-3xl font-bold text-blue-900">{patient.appointments?.length || 0}</p>
                          </div>
                          <Calendar className="h-10 w-10 text-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600 mb-1">Medical Records</p>
                            <p className="text-3xl font-bold text-green-900">{patient.medical_records?.length || 0}</p>
                          </div>
                          <FileText className="h-10 w-10 text-green-500" />
                        </div>
                      </div>

                      <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600 mb-1">Files</p>
                            <p className="text-3xl font-bold text-purple-900">{patient.files?.length || 0}</p>
                          </div>
                          <FileText className="h-10 w-10 text-purple-500" />
                        </div>
                      </div>

                      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-600 mb-1">Blood Type</p>
                            <p className="text-3xl font-bold text-red-900">
                              {patient.patient_info.blood_type || 'N/A'}
                            </p>
                          </div>
                          <Heart className="h-10 w-10 text-red-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Medical Information Tab */}
          <TabsContent value="medical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allergies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span>Allergies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.patient_info.allergies && patient.patient_info.allergies.length > 0 ? (
                    <div className="space-y-2">
                      {patient.patient_info.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-orange-50 text-orange-800">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No known allergies</p>
                  )}
                </CardContent>
              </Card>

              {/* Current Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-green-600" />
                    <span>Current Medications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.patient_info.current_medications && patient.patient_info.current_medications.length > 0 ? (
                    <div className="space-y-2">
                      {patient.patient_info.current_medications.map((medication, index) => (
                        <div key={index} className="p-2 bg-green-50 rounded border">
                          <p className="font-medium text-green-800">{medication}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No current medications</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Medical History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.patient_info.medical_history ? (
                  <div className="p-4 bg-gray-50 rounded border">
                    <p className="text-gray-800 whitespace-pre-wrap">{patient.patient_info.medical_history}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No medical history recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Insurance Information */}
            {patient.patient_info.insurance_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Insurance Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(patient.patient_info.insurance_info).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            {patient.appointments && patient.appointments.length > 0 ? (
              patient.appointments.map((appointment: any) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{new Date(appointment.appointment_date).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-600">Type: {appointment.appointment_type}</p>
                        <p className="text-gray-600">Duration: {appointment.duration_minutes} minutes</p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-500">Notes: {appointment.notes}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments scheduled</p>
              </div>
            )}
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records" className="space-y-4">
            {patient.medical_records && patient.medical_records.length > 0 ? (
              patient.medical_records.map((record: any) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-medium">{record.title || 'Medical Record'}</h4>
                        <p className="text-gray-600">{formatDate(record.created_at)}</p>
                        {record.description && (
                          <p className="text-sm text-gray-500">{record.description}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No medical records available</p>
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            {patient.files && patient.files.length > 0 ? (
              patient.files.map((file: any) => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {file.size && `${Math.round(file.size / 1024)} KB`} • {formatDate(file.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No files uploaded</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}