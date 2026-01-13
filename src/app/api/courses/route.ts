import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// This function handles GET requests to /api/courses
export async function GET() {
  try {
    // Fetch active (non-archived) successful courses
    const activeCourses = await prisma.course.findMany({
      where: {
        status: 'SUCCESS',
        archived: false
      },
      include: {
        sections: {
          include: {
            lectures: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch archived successful courses
    const archivedCourses = await prisma.course.findMany({
      where: {
        status: 'SUCCESS',
        archived: true
      },
      include: {
        sections: {
          include: {
            lectures: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Return both active and archived courses
    return NextResponse.json({
      active: activeCourses,
      archived: archivedCourses
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: errorMessage },
      { status: 500 }
    )
  }
}
