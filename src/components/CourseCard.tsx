'use client'

import Link from 'next/link'

interface CourseCardProps {
  course: {
    id: string
    name: string | null
    term: string | null
    description: string | null
    assessment: string | null
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
  onDelete?: () => void // Callback for when course is deleted
}

export default function CourseCard({ course, onDelete }: CourseCardProps) {
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



  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking delete
    e.stopPropagation() // Stop event bubbling

    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete course')
      }

      // Call the onDelete callback to refresh the course list
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course. Please try again.')
    }
  }

  // Only make successful courses clickable
  if (course.status === 'SUCCESS') {
    return (
      <Link href={`/courses/${course.id}`} className="block">
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 border p-6 cursor-pointer hover:border-blue-300 hover:scale-[1.02] hover:bg-gray-50 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {course.name || 'Untitled Course'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusBadge(course.status)}`}>
                {course.status}
              </span>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                title="Delete course"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Grading - Show All */}
          {course.assessment && (
            <div className="flex-1 mb-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">Assessment & Grading</h4>
              <div className="space-y-1">
                {(() => {
                  try {
                    const assessments = JSON.parse(course.assessment)
                    if (Array.isArray(assessments)) {
                      return assessments.map((assessment: { name: string; weightPercent?: number }, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{assessment.name}</span>
                          {assessment.weightPercent && (
                            <span className="font-bold text-gray-900">{assessment.weightPercent}%</span>
                          )}
                        </div>
                      ))
                    }
                  } catch {
                    // Fall through to display as text
                  }
                  // Plain text: split and show all items
                  const items = course.assessment
                    .split(/[.;\n]+|,\s*(?=[A-Z]|(?:Midterm|Final|Quiz|Lab|Homework|Assignment|Project|Exam|Test))/i)
                    .map(s => s.trim())
                    .filter(Boolean)
                  
                  return items.map((item, idx) => {
                    const percentages = item.match(/\d+%/g)
                    if (percentages && percentages.length > 0) {
                      const lastPercentage = percentages[percentages.length - 1]
                      const lastPercentageIndex = item.lastIndexOf(lastPercentage)
                      const beforePercent = item.substring(0, lastPercentageIndex).trim()
                      const cleanBeforePercent = beforePercent.replace(/[:(\s]+$/, '').trim()
                      
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{cleanBeforePercent}</span>
                          <span className="font-bold text-gray-900">{lastPercentage}</span>
                        </div>
                      )
                    } else {
                      return (
                        <div key={idx} className="text-sm text-gray-700">
                          {item}
                        </div>
                      )
                    }
                  })
                })()}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-100 mt-auto">
            <span className="text-sm text-blue-600 font-medium">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Non-clickable card for loading/failed courses
  return (
    <div className="bg-white rounded-lg shadow-md border p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {course.name || 'Untitled Course'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusBadge(course.status)}`}>
            {course.status}
          </span>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
            title="Delete course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-gray-100 mt-auto">
        {course.status === 'LOADING' ? (
          <div className="flex items-center text-xs text-yellow-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-600 mr-1"></div>
            Processing...
          </div>
        ) : (
          <span className="text-xs text-red-600">Processing failed</span>
        )}
      </div>
    </div>
  )
}
