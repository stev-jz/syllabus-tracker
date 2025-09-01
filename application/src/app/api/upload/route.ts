import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { extractCourseFromPDF } from '../../../lib/gemini'
import path from 'path'
import { writeFile, unlink } from 'fs/promises'

// This function handles POST requests to /api/upload
export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from the request
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null

    // Check if a file was actually uploaded
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file uploaded' },
        { status: 400 }
      )
    }

    // Check if it's actually a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Create a unique filename and save the PDF to the server
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(process.cwd(), 'uploads', filename)
    
    // Convert file to bytes and save it
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create initial course record in database with LOADING status
    const course = await prisma.course.create({
      data: {
        pdfPath: filePath,
        status: 'LOADING'
      }
    })

    // Process the PDF with Gemini AI in the background
    try {
      // Extract course information using AI
      const extractedData = await extractCourseFromPDF(file)

      // Update the course with extracted information
      const updatedCourse = await prisma.course.update({
        where: { id: course.id },
        data: {
          name: extractedData.name,
          term: extractedData.term,
          description: extractedData.description,
          materials: extractedData.materials,
          assessment: extractedData.assessment,
          policies: extractedData.policies,
          examDates: extractedData.examDates,
          status: 'SUCCESS'
        }
      })

      // Create sections and lectures for this course
      for (const sectionData of extractedData.sections) {
        const section = await prisma.section.create({
          data: {
            sectionCode: sectionData.sectionCode || 'TBD',
            instructor: sectionData.instructor || 'TBD',
            courseId: updatedCourse.id
          }
        })

        // Create lectures for this section (only if lectures exist)
        if (sectionData.lectures && Array.isArray(sectionData.lectures)) {
          for (const lectureData of sectionData.lectures) {
            await prisma.lecture.create({
              data: {
                dayOfWeek: lectureData.dayOfWeek || 'TBD',
                startTime: lectureData.startTime || 'TBD',
                endTime: lectureData.endTime || 'TBD',
                location: lectureData.location || 'TBD',
                sectionId: section.id
              }
            })
          }
        }
      }

      // Return success response with course ID
      return NextResponse.json({
        message: 'Course uploaded and processed successfully',
        courseId: updatedCourse.id
      })

    } catch (aiError) {
      // If AI processing fails, delete the course record and PDF file
      await prisma.course.delete({
        where: { id: course.id }
      })

      // Also delete the PDF file
      try {
        await unlink(filePath)
      } catch (deleteError) {
        console.error('Failed to delete PDF file:', deleteError)
      }

      console.error('AI processing failed:', aiError)
      
      // Return a more user-friendly error message
      const errorMessage = aiError instanceof Error && aiError.message.includes('Rate limit') 
        ? 'Rate limit exceeded. Please try again in a few minutes.'
        : 'Failed to process PDF with AI. Please try again.'
        
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}