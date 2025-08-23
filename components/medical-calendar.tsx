"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, UserIcon, FileTextIcon } from "lucide-react"

interface Appointment {
  id: string
  patient_name: string
  doctor_name: string
  appointment_date: string
  duration_minutes: number
  status: string
  appointment_type: string
  notes?: string
  patient_id?: string
}

interface MedicalCalendarProps {
  appointments: Appointment[]
  onDateSelect?: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
  viewMode?: 'month' | 'week' | 'day'
  className?: string
}

export function MedicalCalendar({ 
  appointments = [], 
  onDateSelect, 
  onAppointmentClick,
  viewMode = 'month',
  className = "" 
}: MedicalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day'>(viewMode)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of month and calculate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days
  const calendarDays = []
  
  // Previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(currentYear, currentMonth, -i)
    calendarDays.push({ date: prevDate, isCurrentMonth: false })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    calendarDays.push({ date, isCurrentMonth: true })
  }
  
  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    const nextDate = new Date(currentYear, currentMonth + 1, day)
    calendarDays.push({ date: nextDate, isCurrentMonth: false })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Calendar Header */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-9 w-9 p-0"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="px-4"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-9 w-9 p-0"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Calendar Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-700 text-sm">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Body */}
            <div className="grid grid-cols-7 divide-x divide-gray-200">
              {calendarDays.map((calDay, index) => {
                const dayAppointments = getAppointmentsForDate(calDay.date)
                const isCurrentDay = isToday(calDay.date)
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !calDay.isCurrentMonth ? 'bg-gray-50/50' : ''
                    } ${isCurrentDay ? 'bg-blue-50' : ''}`}
                    onClick={() => onDateSelect?.(calDay.date)}
                  >
                    {/* Date Number */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-medium ${
                        !calDay.isCurrentMonth 
                          ? 'text-gray-400' 
                          : isCurrentDay 
                            ? 'text-blue-600 font-bold' 
                            : 'text-gray-900'
                      }`}>
                        {calDay.date.getDate()}
                      </span>
                      {dayAppointments.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Appointments */}
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment, aptIndex) => (
                        <div
                          key={appointment.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(appointment.status)}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(appointment)
                            onAppointmentClick?.(appointment)
                          }}
                        >
                          <div className="font-medium truncate">
                            {formatTime(appointment.appointment_date)}
                          </div>
                          <div className="truncate opacity-75">
                            {appointment.patient_name}
                          </div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Appointment Status</h4>
            <div className="flex flex-wrap gap-3">
              {[
                { status: 'scheduled', label: 'Scheduled' },
                { status: 'confirmed', label: 'Confirmed' },
                { status: 'in-progress', label: 'In Progress' },
                { status: 'completed', label: 'Completed' },
                { status: 'cancelled', label: 'Cancelled' },
                { status: 'no-show', label: 'No Show' }
              ].map(({ status, label }) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${getStatusColor(status).split(' ')[0]}`}></div>
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span>Appointment Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span>Patient</span>
                  </div>
                  <p className="font-medium">{selectedAppointment.patient_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span>Doctor</span>
                  </div>
                  <p className="font-medium">{selectedAppointment.doctor_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Time</span>
                  </div>
                  <p className="font-medium">{formatTime(selectedAppointment.appointment_date)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Duration</span>
                  </div>
                  <p className="font-medium">{selectedAppointment.duration_minutes} minutes</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getStatusColor(selectedAppointment.status)}>
                  {selectedAppointment.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-600">Type</span>
                <p className="font-medium">{selectedAppointment.appointment_type}</p>
              </div>

              {selectedAppointment.notes && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileTextIcon className="h-4 w-4" />
                    <span>Notes</span>
                  </div>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}