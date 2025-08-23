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
  MapPin, 
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.profile.full_name}</h2>
                <p className="text-gray-600">Patient ID: {patient.id.slice(0, 8)}</p>
              </div>
            </DialogTitle>
            <Button onClick={() => onEdit?.(patient)} variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Patient
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medical">Medical Info</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{patient.profile.email}</p>
                    </div>
                  </div>
                  
                  {patient.profile.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{patient.profile.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">
                        {formatDate(patient.patient_info.date_of_birth)} 
                        <span className="text-gray-500 ml-2">
                          (Age: {calculateAge(patient.patient_info.date_of_birth)})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium capitalize">{patient.patient_info.gender}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span>Emergency Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.patient_info.emergency_contact_name ? (
                    <>
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Contact Name</p>
                          <p className="font-medium">{patient.patient_info.emergency_contact_name}</p>
                        </div>
                      </div>
                      
                      {patient.patient_info.emergency_contact_phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Contact Phone</p>
                            <p className="font-medium">{patient.patient_info.emergency_contact_phone}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No emergency contact information available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                      <p className="text-2xl font-bold text-gray-900">{patient.appointments?.length || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Medical Records</p>
                      <p className="text-2xl font-bold text-gray-900">{patient.medical_records?.length || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Files</p>
                      <p className="text-2xl font-bold text-gray-900">{patient.files?.length || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Blood Type</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {patient.patient_info.blood_type || 'N/A'}
                      </p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
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