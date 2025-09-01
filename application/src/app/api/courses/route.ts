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

    // Return the courses as JSON
    return NextResponse.json(courses)

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
