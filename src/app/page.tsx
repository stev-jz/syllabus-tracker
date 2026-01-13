'use client'

import { useState, useEffect } from 'react'
import UploadForm from '../components/UploadForm'
import CourseCard from '../components/CourseCard'

// Define the shape of our course data
interface Course {
  id: string
  name: string | null
  term: string | null
  description: string | null
  materials: string | null
  assessment: string | null
  policies: string | null
  examDates: string | null
  status: 'LOADING' | 'SUCCESS' | 'FAILED'
  archived: boolean
  createdAt: string
  sections: {
    id: string
    sectionCode: string
    instructor: string
    lectures: {
      id: string
      dayOfWeek: string
      startTime: string
      endTime: string
      location: string
    }[]
  }[]
}

export default function Dashboard() {
  // State to store our courses (active and archived separately)
  const [activeCourses, setActiveCourses] = useState<Course[]>([])
  const [archivedCourses, setArchivedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  // Function to fetch courses from our API
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', response.status, errorData)
        throw new Error(errorData.error || `Failed to fetch courses (${response.status})`)
      }
      
      const data = await response.json()
      setActiveCourses(data.active || [])
      setArchivedCourses(data.archived || [])
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courses'
      setError(errorMessage)
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load courses when component first renders
  useEffect(() => {
    fetchCourses()
  }, [])

  // Function to refresh courses after upload
  const handleUploadSuccess = () => {
    fetchCourses()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Syllabus Tracker
            </h1>
            <p className="mt-2 text-gray-600">
              Upload and manage course syllabi. This is an AI-powered tool that stores the syllabus in a database and allows you to view it here, conveniently.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Courses Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Courses ({activeCourses.length})
            </h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading courses...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Active Courses Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {activeCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onDelete={fetchCourses}
                  onArchive={fetchCourses}
                />
              ))}
              
              {/* Upload Card - always last */}
              <UploadForm onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Empty State for active courses */}
          {!loading && !error && activeCourses.length === 0 && (
            <div className="text-center py-8 mt-6">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active courses</h3>
              <p className="text-gray-600">Upload a syllabus PDF using the card above</p>
            </div>
          )}
        </div>

        {/* Archived Courses Section */}
        {!loading && archivedCourses.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <svg 
                className={`w-5 h-5 transition-transform ${showArchived ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Archived Courses ({archivedCourses.length})</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>

            {showArchived && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {archivedCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onDelete={fetchCourses}
                    onArchive={fetchCourses}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
