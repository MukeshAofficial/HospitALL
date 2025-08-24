"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Edit2, Plus, X, Save, AlertTriangle, Pill, FileText, User, Heart } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function PatientHistoryPage() {
  const [patientData, setPatientData] = useState<any>(null)
  const [medicalHistory, setMedicalHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  
  // Form states for editing
  const [editForm, setEditForm] = useState({
    allergies: [] as string[],
    currentMedications: [] as string[],
    medicalHistory: '',
    bloodType: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    dateOfBirth: '',
    gender: ''
  })
  
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    const fetchPatientHistory = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get patient data
        const { data: patient } = await supabase
          .from("patients")
          .select("*, profiles!inner(*)")
          .eq("profile_id", user.id)
          .single()

        setPatientData(patient)
        
        // Initialize edit form with current data
        if (patient) {
          setEditForm({
            allergies: patient.allergies || [],
            currentMedications: patient.current_medications || [],
            medicalHistory: patient.medical_history || '',
            bloodType: patient.blood_type || '',
            emergencyContactName: patient.emergency_contact_name || '',
            emergencyContactPhone: patient.emergency_contact_phone || '',
            dateOfBirth: patient.date_of_birth || '',
            gender: patient.gender || ''
          })
        }

        // Get medical records for history
        if (patient) {
          const { data: records } = await supabase
            .from("medical_records")
            .select(
              `
              *,
              profiles!medical_records_doctor_id_fkey(full_name)
            `,
            )
            .eq("patient_id", patient.id)
            .order("created_at", { ascending: false })

          setMedicalHistory(records || [])
        }
      }
      setIsLoading(false)
    }

    fetchPatientHistory()
  }, [])

  const updatePatientData = async (updateData: any) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !patientData) return
    
    const { error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('profile_id', user.id)
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update patient information",
        variant: "destructive"
      })
      return false
    }
    
    // Update local state
    setPatientData({ ...patientData, ...updateData })
    toast({
      title: "Success",
      description: "Patient information updated successfully"
    })
    return true
  }

  const saveSection = async (section: string) => {
    let updateData: any = {}
    
    switch (section) {
      case 'allergies':
        updateData = { allergies: editForm.allergies }
        break
      case 'medications':
        updateData = { current_medications: editForm.currentMedications }
        break
      case 'medical-history':
        updateData = { medical_history: editForm.medicalHistory }
        break
      case 'medical-info':
        updateData = {
          blood_type: editForm.bloodType,
          emergency_contact_name: editForm.emergencyContactName,
          emergency_contact_phone: editForm.emergencyContactPhone,
          date_of_birth: editForm.dateOfBirth,
          gender: editForm.gender
        }
        break
    }
    
    const success = await updatePatientData(updateData)
    if (success) {
      setEditingSection(null)
    }
  }

  const addAllergy = () => {
    if (newItem.trim() && !editForm.allergies.includes(newItem.trim())) {
      setEditForm(prev => ({
        ...prev,
        allergies: [...prev.allergies, newItem.trim()]
      }))
      setNewItem('')
    }
  }

  const removeAllergy = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const addMedication = () => {
    if (newItem.trim() && !editForm.currentMedications.includes(newItem.trim())) {
      setEditForm(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, newItem.trim()]
      }))
      setNewItem('')
    }
  }

  const removeMedication = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Medical History</h1>
          <p className="text-muted-foreground mt-2">Your complete medical profile and history</p>
        </div>

        {/* Patient Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-serif flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Basic demographic and contact information</CardDescription>
                </div>
                <Dialog open={editingSection === 'personal-info'} onOpenChange={(open) => !open && setEditingSection(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditingSection('personal-info')}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Personal Information</DialogTitle>
                      <DialogDescription>
                        Update your basic demographic information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={editForm.dateOfBirth}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={editForm.gender} onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}>
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
                      <div className="flex gap-2">
                        <Button onClick={() => saveSection('medical-info')} className="flex-1">
                          <Save className="h-4 w-4 mr-1" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingSection(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{patientData?.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{patientData?.profiles?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{patientData?.profiles?.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span>
                    {patientData?.date_of_birth
                      ? new Date(patientData.date_of_birth).toLocaleDateString()
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize">{patientData?.gender || "Not specified"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-serif flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-600" />
                    Medical Information
                  </CardTitle>
                  <CardDescription>Important medical details and emergency contacts</CardDescription>
                </div>
                <Dialog open={editingSection === 'medical-info'} onOpenChange={(open) => !open && setEditingSection(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditingSection('medical-info')}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Medical Information</DialogTitle>
                      <DialogDescription>
                        Update your medical details and emergency contacts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bloodType">Blood Type</Label>
                        <Select value={editForm.bloodType} onValueChange={(value) => setEditForm(prev => ({ ...prev, bloodType: value }))}>
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
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                        <Input
                          id="emergencyName"
                          value={editForm.emergencyContactName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                          placeholder="Full name of emergency contact"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          value={editForm.emergencyContactPhone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => saveSection('medical-info')} className="flex-1">
                          <Save className="h-4 w-4 mr-1" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingSection(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="font-medium">{patientData?.blood_type || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emergency Contact:</span>
                  <span>{patientData?.emergency_contact_name || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emergency Phone:</span>
                  <span>{patientData?.emergency_contact_phone || "Not provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Allergies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Allergies
                </CardTitle>
                <CardDescription>Known allergies and adverse reactions</CardDescription>
              </div>
              <Dialog open={editingSection === 'allergies'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setEditingSection('allergies')}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Allergies</DialogTitle>
                    <DialogDescription>
                      Add or remove allergies and adverse reactions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newAllergy">Add New Allergy</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newAllergy"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          placeholder="Enter allergy name"
                          onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                        />
                        <Button onClick={addAllergy} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Current Allergies</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {editForm.allergies.length > 0 ? (
                          editForm.allergies.map((allergy, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{allergy}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAllergy(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No allergies added</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveSection('allergies')} className="flex-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSection(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {patientData?.allergies && patientData.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patientData.allergies.map((allergy: string, index: number) => (
                  <Badge key={index} variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No known allergies</p>
            )}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-green-600" />
                  Current Medications
                </CardTitle>
                <CardDescription>Medications you are currently taking</CardDescription>
              </div>
              <Dialog open={editingSection === 'medications'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setEditingSection('medications')}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Current Medications</DialogTitle>
                    <DialogDescription>
                      Add or remove medications you are currently taking
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newMedication">Add New Medication</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newMedication"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          placeholder="Enter medication name and dosage"
                          onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                        />
                        <Button onClick={addMedication} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Current Medications</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {editForm.currentMedications.length > 0 ? (
                          editForm.currentMedications.map((medication, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{medication}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedication(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No medications added</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveSection('medications')} className="flex-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSection(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {patientData?.current_medications && patientData.current_medications.length > 0 ? (
              <div className="space-y-2">
                {patientData.current_medications.map((medication: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                    <Pill className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium">{medication}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No current medications</p>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Medical History
                </CardTitle>
                <CardDescription>Past medical conditions and treatments</CardDescription>
              </div>
              <Dialog open={editingSection === 'medical-history'} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setEditingSection('medical-history')}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Medical History</DialogTitle>
                    <DialogDescription>
                      Update your past medical conditions, surgeries, and treatments
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="medicalHistory">Medical History</Label>
                      <Textarea
                        id="medicalHistory"
                        value={editForm.medicalHistory}
                        onChange={(e) => setEditForm(prev => ({ ...prev, medicalHistory: e.target.value }))}
                        placeholder="Describe your past medical conditions, surgeries, hospitalizations, and significant treatments..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveSection('medical-history')} className="flex-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSection(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {patientData?.medical_history ? (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm whitespace-pre-wrap">{patientData.medical_history}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No medical history recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Medical Records Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Recent Medical Activity</CardTitle>
            <CardDescription>Timeline of recent medical records and treatments</CardDescription>
          </CardHeader>
          <CardContent>
            {medicalHistory.length > 0 ? (
              <div className="space-y-4">
                {medicalHistory.slice(0, 5).map((record: any, index: number) => (
                  <div key={record.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{record.title}</h4>
                          <p className="text-xs text-muted-foreground">Dr. {record.profiles?.full_name}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{record.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent medical activity</p>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
