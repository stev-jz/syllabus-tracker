import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

// Define what information we want Gemini to extract from the PDF
export interface ExtractedCourseData {
  name: string | null
  term: string | null
  description: string | null
  materials: string | null
  assessment: string | null
  policies: string | null
  examDates: string | null
  sections: {
    sectionCode: string
    instructor: string
    lectures: {
      dayOfWeek: string
      startTime: string
      endTime: string
      location: string
    }[]
  }[]
}

// Function that sends PDF to Gemini and gets structured course data back
export async function extractCourseFromPDF(pdfFile: File): Promise<ExtractedCourseData> {
  try {
    // Get the Gemini model that can read files
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        responseMimeType: "application/json" // Make Gemini return JSON
      }
    })

    // Convert the PDF file to the format Gemini needs
    const fileData = {
      inlineData: {
        data: Buffer.from(await pdfFile.arrayBuffer()).toString('base64'),
        mimeType: pdfFile.type
      }
    }

    // Create a detailed prompt for Gemini
    const prompt = `
    Analyze this course syllabus PDF and extract the following information in JSON format:

    {
      "name": "Course name/title",
      "term": "Semester/term (e.g., Fall 2024)",
      "description": "Course description",
      "materials": "Required textbooks, supplies, or materials (if none found, use 'No required materials found')",
      "assessment": "Grading breakdown with percentages",
      "policies": "Course policies, attendance rules, academic integrity, etc.",
      "examDates": "Important exam dates (midterms, finals, major quizzes with dates/times) or 'No exam dates provided' if none found",
      "sections": [
        {
          "sectionCode": "Section code (e.g., LEC0101)",
          "instructor": "Instructor name",
          "lectures": [
            {
              "dayOfWeek": "Day (e.g., Monday)",
              "startTime": "Start time (e.g., 2:00 PM)",
              "endTime": "End time (e.g., 3:00 PM)",
              "location": "Room/building (e.g., BA 1190)"
            }
          ]
        }
      ]
    }

    CRITICAL INSTRUCTIONS FOR ASSESSMENT:
    - Look carefully for tables, charts, or structured data showing grade breakdowns
    - Extract the ACTUAL percentages from grading tables, not just descriptive text
    - If you see a table with assessment items and percentages, extract those exact values
    - Include specific percentage values (e.g., "Midterm: 25%, Final Exam: 50%")
    - Look for words like "weight", "percentage", "points", "marks" near assessment information
    - If there are multiple assessment methods, list them all with their percentages
    - Pay special attention to any tabular data showing grade distributions
    - Do not just extract the text before a table - extract the table contents themselves
    
    IMPORTANT: When interpreting assessment tables:
    - If you see column headers like "Total quizzes", "Total final exam", "Total assignments", etc.
    - The percentage values listed UNDER these column headers represent the weight/percentage for that assessment type
    - For example: If "Total quizzes" column shows "55%" and "Total final exam" column shows "45%", 
      this means quizzes are worth 55% and the final exam is worth 45% of the total grade
    - Always interpret values under column headers as the percentage weight for that assessment category
    - Look for the actual percentage numbers in the table cells, not just in the row labels

    Examples of good assessment extraction:
    - "Midterm: 25%, Lab Exercises: 20%, Final Exam: 55%"
    - "Quizzes (5): 15%, Assignments (3): 30%, Final Project: 55%"
    - "Homework: 10%, Midterm 1: 20%, Midterm 2: 20%, Final: 50%"

    CRITICAL INSTRUCTIONS FOR EXAM DATES:
    - Look for specific dates and times for major exams (midterms, finals, major quizzes)
    - Do NOT include weekly quizzes or regular assignments
    - Extract actual dates, times, and locations if available
    - Examples: "Midterm 1: March 15, 2:00-4:00 PM, Room BA 1190", "Final Exam: April 20, 9:00 AM-12:00 PM"
    - If no specific exam dates are found, use "No exam dates provided"

    INSTRUCTIONS FOR DESCRIPTION AND POLICIES:
    - Extract the full course description as provided in the syllabus
    - Include all relevant course policies (attendance, late work, academic integrity, participation, etc.)
    - Provide comprehensive information that students would need to know

    INSTRUCTIONS FOR MATERIALS:
    - If no required textbooks, supplies, or materials are mentioned, use "No required materials found"
    - If materials are found, list them clearly

    If any information is not found, use null for that field except for:
    - materials: use "No required materials found"
    - examDates: use "No exam dates provided"
    Extract ALL sections, instructors, and lecture times if multiple exist.
    `

    // Send the PDF and prompt to Gemini
    const result = await model.generateContent([prompt, fileData])
    const response = result.response.text()
    
    // Parse Gemini's JSON response
    const extractedData: ExtractedCourseData = JSON.parse(response)
    return extractedData

  } catch (error: unknown) {
    console.error('Error extracting course data:', error)
    
    // Check if it's a rate limit error
    if (error instanceof Error && (error.message?.includes('429') || error.message?.includes('quota'))) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.')
    }
    
    throw new Error('Failed to extract course information from PDF')
  }
}
