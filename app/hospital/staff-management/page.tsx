"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { 
  UserPlus, 
  Users, 
  Stethoscope, 
  HeartHandshake, 
  Eye, 
  Edit,
  Trash2,
  Plus,
  Search,
  Mail,
  Phone,
  Shield
} from "lucide-react"

interface StaffMember {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'doctor' | 'nurse'
  hospital_id: string
  created_at: string
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [currentHospitalId, setCurrentHospitalId] = useState<string>("")
  const [newStaffData, setNewStaffData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    tempPassword: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStaffAndHospital()
  }, [])

  const fetchStaffAndHospital = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get current user's hospital
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single()

      if (profile?.hospital_id) {
        setCurrentHospitalId(profile.hospital_id)
        
        // Fetch staff for this hospital
        const { data: staffData, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, hospital_id, created_at')
          .eq('hospital_id', profile.hospital_id)
          .in('role', ['doctor', 'nurse'])
          .order('created_at', { ascending: false })

        if (!error && staffData) {
          setStaff(staffData as StaffMember[])
        }
      }
    } catch (err) {
      setError('Failed to load staff data')
      console.error('Error fetching staff:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create user account via admin API (would typically be done server-side)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStaffData.email,
        password: newStaffData.tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: newStaffData.fullName,
          role: newStaffData.role,
          hospital_id: currentHospitalId
        }
      })

      if (authError) throw authError

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newStaffData.email,
          full_name: newStaffData.fullName,
          phone: newStaffData.phone,
          role: newStaffData.role,
          hospital_id: currentHospitalId
        })

      if (profileError) throw profileError

      // Reset form and refresh data
      setNewStaffData({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        tempPassword: ""
      })
      setIsAddDialogOpen(false)
      await fetchStaffAndHospital()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add staff member')
      console.error('Error adding staff:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewStaffData(prev => ({ ...prev, tempPassword: password }))
  }

  const filteredStaff = staff.filter(member => 
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const doctorCount = staff.filter(s => s.role === 'doctor').length
  const nurseCount = staff.filter(s => s.role === 'nurse').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-gray-600 mt-1">Manage doctors and nurses in your hospital</p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <span>Add New Staff Member</span>
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={newStaffData.role} 
                    onValueChange={(value) => setNewStaffData(prev => ({ ...prev, role: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newStaffData.fullName}
                    onChange={(e) => setNewStaffData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newStaffData.email}
                    onChange={(e) => setNewStaffData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone (Optional)</Label>
                  <Input
                    type="tel"
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Temporary Password</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generatePassword}
                    >
                      Generate
                    </Button>
                  </div>
                  <Input
                    value={newStaffData.tempPassword}
                    onChange={(e) => setNewStaffData(prev => ({ ...prev, tempPassword: e.target.value }))}
                    placeholder="Enter temporary password"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Staff member will use this to login and should change it immediately
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Staff Member'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Doctors</p>
                  <p className="text-2xl font-bold text-gray-900">{doctorCount}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nurses</p>
                  <p className="text-2xl font-bold text-gray-900">{nurseCount}</p>
                </div>
                <HeartHandshake className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-600" />
              <span>Search Staff</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {member.full_name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={member.role === 'doctor' ? 'text-green-700 border-green-700' : 'text-purple-700 border-purple-700'}
                      >
                        {member.role === 'doctor' ? (
                          <>
                            <Stethoscope className="h-3 w-3 mr-1" />
                            Doctor
                          </>
                        ) : (
                          <>
                            <HeartHandshake className="h-3 w-3 mr-1" />
                            Nurse
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{member.email}</span>
                  </div>
                  
                  {member.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{member.phone}</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Joined: {new Date(member.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm ? 'No staff found' : 'No staff members'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'No staff members match your search criteria.' 
                  : 'Get started by adding your first staff member.'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Staff Member
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}