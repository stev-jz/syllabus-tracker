'use client'

import { useState, useEffect } from 'react'
import UploadForm from '../../components/UploadForm'
import CourseCard from '../../components/CourseCard'

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
  // State to store our courses
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch courses from our API
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
      setCourses(data)
      setError(null)
    } catch (err) {
      setError('Failed to load courses')
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
        {/* Courses Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Courses ({courses.length})
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

          {/* Courses Grid (always show, includes upload card) */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {/* Course Cards first */}
              {courses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onDelete={fetchCourses}
                />
              ))}
              
              {/* Upload Card - always last */}
              <UploadForm onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Empty State (only show when no courses AND not loading) */}
          {!loading && !error && courses.length === 0 && (
            <div className="text-center py-8 mt-6">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600">Upload your first syllabus PDF using the card above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
