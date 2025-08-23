"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Building2, 
  Users, 
  UserCheck, 
  Calendar, 
  Mic, 
  FileText, 
  Settings,
  LogOut,
  Hospital
} from "lucide-react"

interface HospitalLayoutProps {
  children: React.ReactNode
}

export function HospitalLayout({ children }: HospitalLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profile)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/hospital", icon: Building2 },
    { name: "Onboarding", href: "/hospital/onboarding", icon: UserCheck },
    { name: "Patients", href: "/hospital/patients", icon: Users },
    { name: "Staff", href: "/hospital/staff", icon: UserCheck },
    { name: "Staff Management", href: "/hospital/staff-management", icon: Users },
    { name: "Schedule", href: "/hospital/schedule", icon: Calendar },
    { name: "Voice Notes", href: "/hospital/voice-notes", icon: Mic },
    { name: "Files", href: "/hospital/files", icon: FileText },
  ]

  return (
    <AuthGuard allowedRoles={["admin", "doctor", "nurse"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Professional Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <Hospital className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">HospitALL</h1>
                    <p className="text-xs text-gray-500 -mt-1">Healthcare Management</p>
                  </div>
                </div>
                <nav className="hidden lg:ml-8 lg:flex lg:space-x-1">
                  {navigation.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          pathname === item.href
                            ? "bg-blue-100 text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-1" />
                        <span className="hidden xl:inline">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-sm text-gray-700 hidden sm:block">
                  <span className="font-medium">{profile?.full_name}</span>
                  <span className="text-gray-500 ml-1">({profile?.role})</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 flex-shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </AuthGuard>
  )
}
