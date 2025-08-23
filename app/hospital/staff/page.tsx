"use client"

import { HospitalLayout } from "@/components/hospital-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStaff = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["admin", "doctor", "nurse"])
        .order("created_at", { ascending: false })

      if (!error && data) {
        setStaff(data)
      }
      setIsLoading(false)
    }

    fetchStaff()
  }, [])

  const filteredStaff = staff.filter((member: any) => member.full_name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-chart-4 text-white"
      case "doctor":
        return "bg-chart-1 text-white"
      case "nurse":
        return "bg-chart-2 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <HospitalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </HospitalLayout>
    )
  }

  return (
    <HospitalLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground mt-2">Manage hospital staff and healthcare professionals</p>
          </div>
          <Button asChild>
            <Link href="/hospital/onboarding">Add New Staff</Link>
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Search Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by staff name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Staff Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{staff.length}</div>
              <p className="text-xs text-muted-foreground">Total staff members</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((member: any) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-serif">{member.full_name}</CardTitle>
                      <CardDescription>{member.email}</CardDescription>
                    </div>
                    <Badge className={getRoleBadgeColor(member.role)}>{member.role.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{member.phone || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/hospital/staff/${member.id}`}>View Profile</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/hospital/staff/${member.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">👨‍⚕️</div>
              <h3 className="text-lg font-serif font-medium text-foreground mb-2">No staff found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No staff members match your search criteria." : "Get started by adding staff members."}
              </p>
              <Button asChild>
                <Link href="/hospital/onboarding">Add Staff Member</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </HospitalLayout>
  )
}
