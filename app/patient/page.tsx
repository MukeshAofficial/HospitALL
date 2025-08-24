"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Calendar, FileText, Activity, BookOpen, History, Heart } from "lucide-react"

export default function PatientDashboard() {
  const [patientData, setPatientData] = useState<any>(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hospitalName, setHospitalName] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('Auth error:', authError)
          setIsLoading(false)
          return
        }

        // First, try to fetch just the patient record
        console.log('Fetching patient data for user:', user.id)
        
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select('*')
          .eq("profile_id", user.id)
          .maybeSingle()

        if (patientError) {
          console.error('Patient fetch error:', patientError)
          console.error('Patient fetch error details:', {
            message: patientError.message,
            details: patientError.details,
            hint: patientError.hint,
            code: patientError.code
          })
        }

        // If patient exists, fetch profile and hospital data separately
        let profileData = null
        let hospitalData = null
        
        if (patient) {
          // Fetch profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .eq('id', user.id)
            .single()
            
          if (profileError) {
            console.error('Profile fetch error:', profileError)
          } else {
            profileData = profile
          }
          
          // Fetch hospital data if patient has hospital_id
          if (patient.hospital_id) {
            const { data: hospital, error: hospitalError } = await supabase
              .from('hospitals')
              .select('id, name, city, state')
              .eq('id', patient.hospital_id)
              .single()
              
            if (hospitalError) {
              console.error('Hospital fetch error:', hospitalError)
            } else {
              hospitalData = hospital
            }
          }
          
          // Combine the data
          const combinedPatient = {
            ...patient,
            profiles: profileData,
            hospitals: hospitalData
          }
          
          setPatientData(combinedPatient)
        }
        
        // If no patient record exists, create one
        if (!patient && !patientError) {
          console.log('No patient record found, creating one...')
          
          // First get the profile to ensure it exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profile) {
            const { data: newPatient, error: createError } = await supabase
              .from('patients')
              .insert({
                profile_id: user.id
              })
              .select('*')
              .single()

            if (createError) {
              console.error('Error creating patient record:', createError)
            } else {
              console.log('Successfully created patient record')
              const combinedNewPatient = {
                ...newPatient,
                profiles: {
                  id: profile.id,
                  full_name: profile.full_name,
                  email: profile.email,
                  phone: profile.phone
                }
              }
              setPatientData(combinedNewPatient)
              profileData = profile
            }
          } else {
            console.error('No profile found for user')
          }
        }
        
        // Set hospital name if available
        setHospitalName(hospitalData?.name || null)
        
        // Get the current patient data for appointments and records fetching
        const currentPatient = patient || (patientData ? patientData : null)

        // Only fetch additional data if we have a patient record
        if (currentPatient?.id) {
          // Fetch upcoming appointments (next 30 days)
          const thirtyDaysFromNow = new Date()
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
          
          const { data: appointments, error: appointmentsError } = await supabase
            .from("appointments")
            .select(`
              *,
              profiles!appointments_doctor_id_fkey(full_name)
            `)
            .eq("patient_id", currentPatient.id)
            .gte("appointment_date", new Date().toISOString())
            .lte("appointment_date", thirtyDaysFromNow.toISOString())
            .order("appointment_date", { ascending: true })
            .limit(5)

          if (appointmentsError) {
            console.error('Appointments fetch error:', appointmentsError)
          } else {
            setUpcomingAppointments(appointments || [])
          }

          // Fetch recent medical records
          const { data: records, error: recordsError } = await supabase
            .from("medical_records")
            .select(`
              *,
              profiles!medical_records_doctor_id_fkey(full_name)
            `)
            .eq("patient_id", currentPatient.id)
            .order("created_at", { ascending: false })
            .limit(5)

          if (recordsError) {
            console.error('Medical records fetch error:', recordsError)
          } else {
            setRecentRecords(records || [])
          }
        } else {
          console.log('No patient ID available, skipping appointments and records fetch')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Welcome back, {patientData?.profiles?.full_name || 'Patient'}!
          </h1>
          <p className="text-muted-foreground mt-2">Here's an overview of your health information</p>
          {hospitalName && (
            <p className="text-sm text-blue-600 mt-1">Receiving care at {hospitalName}</p>
          )}
          {!patientData && (
            <p className="text-sm text-orange-600 mt-2">
              Please complete your profile to access all features
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-chart-1" />
              </div>
              <CardTitle className="text-lg font-serif">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">{upcomingAppointments.length}</div>
              <p className="text-sm text-muted-foreground">Next 30 days</p>
              {upcomingAppointments.length === 0 && (
                <Button size="sm" className="mt-2" asChild>
                  <Link href="/appointments/new">Book Now</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle className="text-lg font-serif">Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">{recentRecords.length}</div>
              <p className="text-sm text-muted-foreground">Recent entries</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-chart-3/10 rounded-full flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-chart-3" />
              </div>
              <CardTitle className="text-lg font-serif">Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">
                {patientData?.medical_history || patientData?.current_medications?.length > 0 
                  ? 'Under Care' 
                  : 'Good'
                }
              </div>
              <p className="text-sm text-muted-foreground">
                {hospitalName ? `At ${hospitalName}` : 'Overall health'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Your Information</CardTitle>
              <CardDescription>Personal and medical details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{patientData?.profiles?.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-sm">{patientData?.profiles?.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="text-sm">
                    {patientData?.date_of_birth
                      ? new Date(patientData.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="text-sm font-medium text-red-600">{patientData?.blood_type || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="text-sm capitalize">{patientData?.gender || "Not specified"}</span>
                </div>
                {patientData?.emergency_contact_name && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emergency Contact:</span>
                      <span className="text-sm">{patientData.emergency_contact_name}</span>
                    </div>
                    {patientData?.emergency_contact_phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Emergency Phone:</span>
                        <span className="text-sm">{patientData.emergency_contact_phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                <Link href="/patient/profile-completion">Update Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled medical appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="p-3 bg-muted rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            Dr. {appointment.profiles?.full_name || 'Unknown Doctor'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {appointment.appointment_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {appointment.duration_minutes || 30} minutes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">
                            {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(appointment.appointment_date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <p className="text-xs text-muted-foreground mt-1">Book your next appointment to get started</p>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/patient/appointments">View All Appointments</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Recent Medical Records</CardTitle>
              <CardDescription>Latest entries from your healthcare providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRecords.length > 0 ? (
                  recentRecords.map((record: any) => (
                    <div key={record.id} className="p-3 bg-muted rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-green-500" />
                            {record.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By Dr. {record.profiles?.full_name || 'Unknown Doctor'}
                          </p>
                          {record.content && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {record.content.length > 80 
                                ? record.content.substring(0, 80) + '...' 
                                : record.content
                              }
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            record.record_type === 'diagnosis' ? 'bg-red-100 text-red-800' :
                            record.record_type === 'treatment' ? 'bg-blue-100 text-blue-800' :
                            record.record_type === 'prescription' ? 'bg-green-100 text-green-800' :
                            record.record_type === 'lab_result' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.record_type?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">No medical records yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Your medical records will appear here after appointments</p>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                <Link href="/patient/records">View All Records</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
              <CardDescription>Common tasks and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/diary">
                    <BookOpen className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm">Health Diary</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/appointments">
                    <Calendar className="h-6 w-6 mb-2 text-green-600" />
                    <span className="text-sm">Appointments</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/history">
                    <Activity className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="text-sm">Medical History</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/patient/records">
                    <FileText className="h-6 w-6 mb-2 text-orange-600" />
                    <span className="text-sm">Records</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
