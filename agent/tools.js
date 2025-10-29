// agent/tools.js
const { z } = require("zod");

// If your Zod < 3.22 and .datetime() is missing, keep your ISO_DATETIME shim here.
// const ISO_DATETIME = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);

// -----------------------------
// Schemas
// -----------------------------
const Schemas = {
  // --- Events ---
  getUpcomingEvents: z.object({
    from: z.string().datetime(), // or ISO_DATETIME
    to: z.string().datetime(),   // or ISO_DATETIME
    mode: z.enum(["Online","In-Person","Hybrid"]).optional(),
    limit: z.number().int().positive().max(50).optional()
  }),

  // --- Programs ---
  searchPrograms: z.object({
    q: z.string().min(1).max(200).optional(),
    tag: z.string().min(1).max(50).optional(),
    limit: z.number().int().positive().max(50).optional()
  }).refine(v => v.q || v.tag, { message: "Provide q or tag." }),

  // --- Courses ---
  searchCourses: z.object({
    q:         z.string().min(1).max(200).optional(),        // text in title/description
    category:  z.string().min(1).max(80).optional(),
    instructor:z.string().min(1).max(120).optional(),
    level:     z.enum(['Beginner','Intermediate','Advanced']).optional(),
    minRating: z.number().min(0).max(5).optional(),
    sort:      z.enum(['rating','recent','price']).optional(),
    limit:     z.number().int().positive().max(50).optional()
  }).refine(v => v.q || v.category || v.instructor || v.level || v.minRating, {
    message: "Provide at least one filter (q, category, instructor, level, minRating)."
  }),

  getCourseByTitle: z.object({
    title: z.string().min(1).max(200)
  }),

  listCoursesByInstructor: z.object({
    instructor: z.string().min(1).max(120),
    limit: z.number().int().positive().max(50).optional()
  }),

  listCoursesByCategory: z.object({
    category: z.string().min(1).max(80),
    limit: z.number().int().positive().max(50).optional()
  }),

  listCourseCategories: z.object({}),


  // --- Scholarships ---
  // Based on your Scholarship model fields:
  // title, description, requirements, CreatedBy (string), value (number), type (string), applicants [User ObjectId], timestamps
  searchScholarships: z.object({
    q:         z.string().min(1).max(200).optional(),     // matches title/description/requirements
    type:      z.string().min(1).max(80).optional(),
    createdBy: z.string().min(1).max(120).optional(),     // scholarship_CreatedBy
    minValue:  z.number().min(0).optional(),
    maxValue:  z.number().min(0).optional(),
    applicant: z.string().min(1).optional(),              // userId to filter by applied/not applied (implementation choice)
    applied:   z.boolean().optional(),                    // true: only ones this applicant applied to; false: not applied
    sort:      z.enum(['recent','value_desc','value_asc']).optional(),
    limit:     z.number().int().positive().max(50).optional()
  }).refine(v => v.q || v.type || v.createdBy || v.minValue !== undefined || v.maxValue !== undefined || v.applicant !== undefined, {
    message: "Provide at least one filter (q, type, createdBy, minValue, maxValue, applicant)."
  }),

  getScholarshipByTitle: z.object({
    title: z.string().min(1).max(200)
  }),

  listScholarshipsByType: z.object({
    type: z.string().min(1).max(80),
    limit: z.number().int().positive().max(50).optional()
  }),

  listScholarshipsByCreator: z.object({
    createdBy: z.string().min(1).max(120),
    limit: z.number().int().positive().max(50).optional()
  }),

  getScholarshipApplicants: z.object({
    title: z.string().min(1).max(200) // or you could use scholarship id in your implementation
  })
};

// -----------------------------
// Tool Definitions
// -----------------------------
function defineTools() {
  return [
    // --- Events ---
    {
      type: "function",
      function: {
        name: "get_upcoming_events",
        description: "List upcoming events/workshops in a date range with optional mode filter.",
        parameters: {
          type: "object",
          properties: {
            from: { type: "string", description: "ISO datetime start (e.g., 2025-09-12T00:00:00Z)" },
            to:   { type: "string", description: "ISO datetime end (e.g., 2025-09-30T23:59:59Z)" },
            mode: { type: "string", enum: ["Online","In-Person","Hybrid"] },
            limit:{ type: "number" }
          },
          required: ["from","to"]
        }
      }
    },

    // --- Programs ---
    {
      type: "function",
      function: {
        name: "search_programs",
        description: "Search programs by text or tag.",
        parameters: {
          type: "object",
          properties: {
            q: { type: "string" },
            tag: { type: "string" },
            limit: { type: "number" }
          }
        }
      }
    },

    // --- Courses ---
    {
      type: "function",
      function: {
        name: "search_courses",
        description:
          "Search courses by free text or filters. Supports q (title/description), category, instructor, level, minRating; sort by rating|recent|price.",
        parameters: {
          type: "object",
          properties: {
            q:         { type: "string" },
            category:  { type: "string" },
            instructor:{ type: "string" },
            level:     { type: "string", enum: ['Beginner','Intermediate','Advanced'] },
            minRating: { type: "number" },
            sort:      { type: "string", enum: ['rating','recent','price'] },
            limit:     { type: "number" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_course_by_title",
        description: "Fetch one course by exact (case-insensitive) title and return its full details.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_courses_by_instructor",
        description: "List all courses taught by a specific instructor.",
        parameters: {
          type: "object",
          properties: {
            instructor: { type: "string" },
            limit: { type: "number" }
          },
          required: ["instructor"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_courses_by_category",
        description: "List courses within a category.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string" },
            limit: { type: "number" }
          },
          required: ["category"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_course_categories",
        description: "List all distinct course categories.",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    },

    // --- Scholarships ---
    {
      type: "function",
      function: {
        name: "search_scholarships",
        description:
          "Search scholarships by free text or filters. Supports q (title/description/requirements), type, createdBy, value range, applicant/applied; sort by recent or value.",
        parameters: {
          type: "object",
          properties: {
            q:         { type: "string" },
            type:      { type: "string" },
            createdBy: { type: "string" },
            minValue:  { type: "number" },
            maxValue:  { type: "number" },
            applicant: { type: "string", description: "User ID to filter by application state" },
            applied:   { type: "boolean", description: "true = only scholarships this applicant applied to; false = not applied" },
            sort:      { type: "string", enum: ['recent','value_desc','value_asc'] },
            limit:     { type: "number" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_scholarship_by_title",
        description: "Fetch one scholarship by exact (case-insensitive) title and return its full details.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_scholarships_by_type",
        description: "List scholarships for a given type (e.g., Merit, Need-based, Research).",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string" },
            limit: { type: "number" }
          },
          required: ["type"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_scholarships_by_creator",
        description: "List scholarships created by a specific creator (scholarship_CreatedBy).",
        parameters: {
          type: "object",
          properties: {
            createdBy: { type: "string" },
            limit: { type: "number" }
          },
          required: ["createdBy"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_scholarship_applicants",
        description: "Get the applicants (User IDs) for a scholarship identified by title.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    }
  ];
}

module.exports = { defineTools, Schemas };
