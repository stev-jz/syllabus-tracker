'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface CourseDetailData {
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
  updatedAt: string
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

// Component for expandable instructors and schedule
function InstructorsSchedule({ sections }: { sections: CourseDetailData['sections'] }) {
  const [expandedType, setExpandedType] = useState<string | null>(null)

  // Group sections by type (LEC, TUT, PRA, etc.)
  const groupedSections = sections.reduce((acc, section) => {
    const type = section.sectionCode.match(/^([A-Z]+)/)?.[1] || 'OTHER'
    if (!acc[type]) acc[type] = []
    acc[type].push(section)
    return acc
  }, {} as Record<string, typeof sections>)

  const toggleExpanded = (type: string) => {
    setExpandedType(expandedType === type ? null : type)
  }

  return (
    <div className="space-y-3">
      {Object.entries(groupedSections).map(([type, typeSections]) => (
        <div key={type} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleExpanded(type)}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-mono px-2 py-1 rounded">
                {type}
              </span>
              <span className="text-gray-600 text-sm">
                ({typeSections.length} section{typeSections.length !== 1 ? 's' : ''})
              </span>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${expandedType === type ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedType === type && (
            <div className="px-3 pb-3 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2 mt-2">
                {typeSections.map((section) => (
                  <div key={section.id} className="bg-white rounded p-2 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-mono px-1.5 py-0.5 rounded">
                          {section.sectionCode}
                        </span>
                        {section.instructor && section.instructor.trim() && (
                          <span className="text-sm font-medium text-gray-700">
                            {section.instructor}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {section.lectures && section.lectures.length > 0 && (
                      <div className="text-xs text-gray-600 space-y-1">
                        {section.lectures.map((lecture) => (
                          <div key={lecture.id} className="flex items-center justify-between">
                            <span className="font-medium">{lecture.dayOfWeek}</span>
                            <span>{lecture.startTime} - {lecture.endTime}</span>
                            <span className="text-blue-600">📍 {lecture.location}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  
  const [course, setCourse] = useState<CourseDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/courses/${courseId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch course details')
        }
        
        const data = await response.json()
        setCourse(data)
        setError(null)
      } catch (err) {
        setError('Failed to load course details')
        console.error('Error fetching course:', err)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading course details...</span>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error || 'Course not found'}</p>
            <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'LOADING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/" className="text-blue-600 hover:underline text-sm font-medium">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">
                  {course.name || 'Untitled Course'}
                </h1>
                {course.term && (
                  <p className="text-gray-600 mt-1">{course.term}</p>
                )}
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-md border ${getStatusBadge(course.status)}`}>
                {course.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Assessment */}
          {course.assessment && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment & Grading</h2>
              <div className="prose prose-sm max-w-none">
                {(() => {
                  try {
                    const assessments = JSON.parse(course.assessment)
                    if (Array.isArray(assessments)) {
                      return (
                        <ul className="space-y-2">
                          {assessments.map((assessment: { name: string; notes?: string; weightPercent?: number }, idx: number) => (
                            <li key={idx} className="flex items-center justify-between">
                              <div>
                                <span className="text-gray-900">{assessment.name}: </span>
                                {assessment.notes && (
                                  <span className="text-sm text-gray-600">({assessment.notes})</span>
                                )}
                              </div>
                              {assessment.weightPercent && (
                                <span className="font-bold text-gray-900">
                                  {assessment.weightPercent}%
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )
                    }
                  } catch {
                    // Fall through to display as text
                  }
                  // Plain text: split into lines and bold percentages
                  // Split on periods, semicolons, newlines, and commas only when followed by common assessment words
                  const items = course.assessment
                    .split(/[.;\n]+|,\s*(?=[A-Z]|(?:Midterm|Final|Quiz|Lab|Homework|Assignment|Project|Exam|Test))/i)
                    .map(s => s.trim())
                    .filter(Boolean)
                  return (
                    <ul className="space-y-2">
                      {items.map((item, idx) => {
                        // Find the last percentage in the line (main grade weight)
                        const percentages = item.match(/\d+%/g)
                        if (percentages && percentages.length > 0) {
                          const lastPercentage = percentages[percentages.length - 1]
                          const lastPercentageIndex = item.lastIndexOf(lastPercentage)
                          const beforePercent = item.substring(0, lastPercentageIndex).trim()
                          const afterPercent = item.substring(lastPercentageIndex + lastPercentage.length).trim()
                          
                          // Clean up the text before percentage (remove trailing colons and opening parens around percentage)
                          const cleanBeforePercent = beforePercent.replace(/[:(\s]+$/, '').trim()
                          // Clean up text after percentage (remove closing parens around percentage)
                          const cleanAfterPercent = afterPercent.replace(/^[\s)]+/, '').trim()
                          
                          return (
                            <li key={idx} className="text-gray-900">
                              {cleanBeforePercent}: <span className="font-bold">{lastPercentage}</span>{cleanAfterPercent && ` ${cleanAfterPercent}`}
                            </li>
                          )
                        } else {
                          // No percentage found, display as-is
                          return (
                            <li key={idx} className="text-gray-900">
                              {item}
                            </li>
                          )
                        }
                      })}
                    </ul>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Exam Dates */}
          {course.examDates && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Dates</h2>
              <div className="prose prose-sm max-w-none">
                {(() => {
                  try {
                    const examDates = JSON.parse(course.examDates)
                    if (Array.isArray(examDates)) {
                      return (
                        <ul className="space-y-3">
                          {examDates.map((exam: { name: string; date?: string; time?: string; location?: string }, idx: number) => (
                            <li key={idx} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50">
                              <div className="font-semibold text-gray-900">{exam.name}</div>
                              {exam.date && (
                                <div className="text-sm text-gray-700">📅 {exam.date}</div>
                              )}
                              {exam.time && (
                                <div className="text-sm text-gray-700">🕒 {exam.time}</div>
                              )}
                              {exam.location && (
                                <div className="text-sm text-gray-700">📍 {exam.location}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )
                    }
                  } catch {
                    // Fall through to display as text
                  }
                  // Plain text: split into lines and display each exam
                  const examItems = course.examDates
                    .split(/[.;\n]+|,\s*(?=[A-Z]|(?:Midterm|Final|Quiz|Exam|Test))/i)
                    .map(s => s.trim())
                    .filter(Boolean)
                  return (
                    <ul className="space-y-3">
                      {examItems.map((item, idx) => (
                        <li key={idx} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50">
                          <div className="text-gray-900">{item}</div>
                        </li>
                      ))}
                    </ul>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Required Materials */}
          {course.materials && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Materials</h2>
              <div className="prose prose-sm max-w-none">
                {(() => {
                  try {
                    const materials = JSON.parse(course.materials)
                    if (Array.isArray(materials)) {
                      return (
                        <ul className="list-disc list-inside space-y-1">
                          {materials.map((material: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{material}</li>
                          ))}
                        </ul>
                      )
                    }
                  } catch {
                    // Fall through to display as text
                  }
                  return <p className="text-gray-700">{course.materials}</p>
                })()}
              </div>
            </div>
          )}

          {/* Course Description */}
          {course.description && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Description</h2>
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Instructors & Sections */}
          {course.sections && course.sections.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Instructors & Schedule ({course.sections.length} sections)
              </h2>
              <InstructorsSchedule sections={course.sections} />
            </div>
          )}

          {/* Policies */}
          {course.policies && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Policies</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">{course.policies}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Uploaded:</span>
                <span className="ml-2 text-gray-600">{formatDate(course.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">{formatDate(course.updatedAt)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Course ID:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs">{course.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Sections:</span>
                <span className="ml-2 text-gray-600">{course.sections.length}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
