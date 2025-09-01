import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    // Fetch specific course with all related data
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lectures: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    // First, get the course to find the PDF path
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Delete the course from database (this will cascade delete sections and lectures)
    await prisma.course.delete({
      where: { id: courseId }
    })

    // Delete the PDF file
    try {
      if (course.pdfPath && fs.existsSync(course.pdfPath)) {
        fs.unlinkSync(course.pdfPath)
      }
    } catch (fileError) {
      console.error('Failed to delete PDF file:', fileError)
      // Continue anyway since database deletion succeeded
    }

    return NextResponse.json({ 
      message: 'Course deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
