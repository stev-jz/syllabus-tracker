import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// This function handles GET requests to /api/courses
export async function GET() {
  try {
    // Fetch only successful courses from database with their sections and lectures
    const courses = await prisma.course.findMany({
      where: {
        status: 'SUCCESS' // Only show successfully processed courses
      },
      include: {
        sections: {
          include: {
            lectures: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Show newest courses first
      }
    })

    // Debug: Log the count and statuses
    const allCourses = await prisma.course.findMany({
      select: { id: true, name: true, status: true }
    })
    console.log('Total courses in DB:', allCourses.length)
    console.log('Course statuses:', allCourses.map(c => ({ name: c.name, status: c.status })))
    console.log('Successful courses:', courses.length)

    // Return the courses as JSON
    return NextResponse.json(courses)

  } catch (error) {
    console.error('Error fetching courses:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
