"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { 
  Users, 
  Shield, 
  Stethoscope, 
  HeartHandshake, 
  UserCheck, 
  Mail, 
  Phone, 
  Eye, 
  Edit,
  Search,
  Plus
} from "lucide-react"

interface StaffMember {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'admin' | 'doctor' | 'nurse'
  hospital_id: string
  created_at: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isFixingDoctors, setIsFixingDoctors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentHospitalId, setCurrentHospitalId] = useState<string>("")

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
        
        // Fetch all staff for this hospital (including admins, doctors, nurses)
        const { data: staffData, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, hospital_id, created_at')
          .eq('hospital_id', profile.hospital_id)
          .in('role', ['admin', 'doctor', 'nurse'])
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

  const handleFixDoctors = async () => {
    setIsFixingDoctors(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/fix-doctors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fix doctors')
      }

      // Refresh staff data to see the changes
      await fetchStaffAndHospital()
      
      alert(`Success! ${result.message}\n\nUpdated ${result.updated_count} staff members.`)
      
    } catch (error: any) {
      setError(error.message || 'Failed to fix doctors')
    } finally {
      setIsFixingDoctors(false)
    }
  }

  const filteredStaff = staff.filter((member: StaffMember) => 
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-600 text-white"
      case "doctor":
        return "bg-green-600 text-white"
      case "nurse":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <UserCheck className="h-3 w-3 mr-1" />
      case "doctor":
        return <Stethoscope className="h-3 w-3 mr-1" />
      case "nurse":
        return <HeartHandshake className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  const doctorCount = staff.filter(s => s.role === 'doctor').length
  const nurseCount = staff.filter(s => s.role === 'nurse').length
  const adminCount = staff.filter(s => s.role === 'admin').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-800">
                <h3 className="text-sm font-medium">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-gray-600 mt-1">Manage doctors, nurses and hospital staff</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleFixDoctors}
              disabled={isFixingDoctors}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isFixingDoctors ? 'Fixing...' : 'Fix Doctor Assignments'}
            </Button>
            
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/hospital/onboarding">
                <Plus className="h-4 w-4 mr-2" />
                Add New Staff
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-indigo-500" />
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
                        className={`mt-1 ${getRoleBadgeColor(member.role)}`}
                      >
                        {getRoleIcon(member.role)}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
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
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/hospital/onboarding">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Staff Member
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
  )
}
