// controllers/agentController.js
const OpenAI = require("openai");
const { MongoClient, ObjectId } = require("mongodb");
const { defineTools, Schemas } = require("../agent/tools");

// ---------- DB setup (lazy connect to avoid undefined db on first hit) ----------
const client = new MongoClient(process.env.MONGO_URI, { maxPoolSize: 5 });
let _db = null;

async function getDb() {
  if (_db) return _db;
  await client.connect();
  _db = client.db(process.env.DB_NAME);
  return _db;
}

// ---------- OpenRouter (DeepSeek) ----------
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
const MODEL = "deepseek/deepseek-chat"; // <-- use DeepSeek via OpenRouter

// ---------- System behavior ----------
const SYSTEM_PROMPT = `
You are FEKRA's website assistant.
- For general website questions (mission, how to apply, features), answer directly and concisely.
- For dynamic data (events, programs, scholarships, courses), call the most relevant TOOL with precise arguments.
- For courses:
  • Use search_courses for filters (q, category, instructor, level, minRating, sort).
  • Use get_course_by_title when the user names an exact course title.
  • Use list_courses_by_instructor or list_courses_by_category when that’s what they ask.
  • Use list_course_categories to list available categories.
- For scholarships:
  • Use search_scholarships for filters (q, type, createdBy, min/max value, applicant + applied flag, sort).
  • Use get_scholarship_by_title when an exact title is provided.
  • Use list_scholarships_by_type or list_scholarships_by_creator when that’s what they ask.
  • Use get_scholarship_applicants to fetch applicant IDs for a scholarship.
- For FAQs:
  • Use search_faqs for keyword/typo queries.
  • Use get_faq_by_question if the exact question is provided.
- Dates in answers should use YYYY-MM-DD.
- Never invent fields/links. Only display what tools return.
`;

// ---------- utils ----------
function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeQ(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "") // strip accents
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
    }
  }
  return dp[m][n];
}

// ---------- Tool implementations (READ-ONLY) ----------
async function getUpcomingEvents(args) {
  const p = Schemas.getUpcomingEvents.parse(args);
  const db = await getDb();

  const query = { startsAt: { $gte: new Date(p.from), $lte: new Date(p.to) } };
  if (p.mode) query.mode = p.mode;

  const limit = p.limit ?? 10;

  const items = await db
    .collection("events")
    .find(
      query,
      {
        projection: {
          title: 1,
          startsAt: 1,
          endsAt: 1,
          mode: 1,
          location: 1,
          link: 1,
        },
      }
    )
    .sort({ startsAt: 1 })
    .limit(limit)
    .toArray();

  return items;
}

async function searchPrograms(args) {
  const p = Schemas.searchPrograms.parse(args);
  const db = await getDb();

  const query = {};
  if (p.q) query.$text = { $search: p.q };
  if (p.tag) query.tags = p.tag;

  const limit = p.limit ?? 10;

  const items = await db
    .collection("programs")
    .find(
      query,
      {
        projection: {
          title: 1,
          mode: 1,
          tags: 1,
          startsAt: 1,
          endsAt: 1,
          _id: 1,
        },
      }
    )
    .limit(limit)
    .toArray();

  return items;
}

/* ========================== Course tools ========================== */

async function searchCourses(args) {
  const p = Schemas.searchCourses.parse(args);
  const db = await getDb();
  const col = db.collection("courses");

  const filter = {};
  if (p.q) {
    const rx = new RegExp(escapeRegex(p.q), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (p.category) filter.category = p.category;
  if (p.instructor) filter.instructor = new RegExp(`^${escapeRegex(p.instructor)}$`, "i");
  if (p.level) filter.level = p.level;
  if (p.minRating != null) filter.ratingAvg = { $gte: p.minRating };

  const limit = p.limit ?? 20;

  // Sorting
  let sort = { createdAt: -1 }; // default "recent"
  if (p.sort === "rating") sort = { ratingAvg: -1, ratingCount: -1 };
  if (p.sort === "recent") sort = { createdAt: -1 };
  if (p.sort === "price") sort = { price: 1 }; // NOTE: 'price' is a string in your schema

  const projection = {
    title: 1,
    description: 1,
    price: 1,
    instructor: 1,
    durationDays: 1,
    level: 1,
    category: 1,
    ratingAvg: 1,
    ratingCount: 1,
    createdAt: 1,
    updatedAt: 1,
  };

  const items = await col.find(filter, { projection }).sort(sort).limit(limit).toArray();
  return items;
}

async function getCourseByTitle(args) {
  const p = Schemas.getCourseByTitle.parse(args);
  const db = await getDb();
  const col = db.collection("courses");

  const titleRx = new RegExp(`^${escapeRegex(p.title)}$`, "i");

  const course = await col.findOne(
    { title: titleRx },
    {
      projection: {
        title: 1,
        description: 1,
        price: 1,
        instructor: 1,
        durationDays: 1,
        level: 1,
        category: 1,
        ratingAvg: 1,
        ratingCount: 1,
        enrolledStudents: 1,
        pendingStudents: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  return course || null;
}

async function listCoursesByInstructor(args) {
  const p = Schemas.listCoursesByInstructor.parse(args);
  const db = await getDb();
  const col = db.collection("courses");

  const rx = new RegExp(`^${escapeRegex(p.instructor)}$`, "i");
  const limit = p.limit ?? 50;

  const items = await col
    .find(
      { instructor: rx },
      {
        projection: {
          title: 1,
          category: 1,
          level: 1,
          durationDays: 1,
          ratingAvg: 1,
          ratingCount: 1,
          price: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return items;
}

async function listCoursesByCategory(args) {
  const p = Schemas.listCoursesByCategory.parse(args);
  const db = await getDb();
  const col = db.collection("courses");
  const limit = p.limit ?? 50;

  const items = await col
    .find(
      { category: p.category },
      {
        projection: {
          title: 1,
          instructor: 1,
          level: 1,
          durationDays: 1,
          ratingAvg: 1,
          ratingCount: 1,
          price: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return items;
}

async function listCourseCategories(_args) {
  const db = await getDb();
  const col = db.collection("courses");
  const cats = await col.distinct("category");
  return (cats || []).filter(Boolean).sort();
}

/* ========================== Scholarship tools ========================== */

async function searchScholarships(args) {
  const p = Schemas.searchScholarships.parse(args);
  const db = await getDb();
  const col = db.collection("scholarships");

  const filter = {};
  // free-text across title/description/requirements
  if (p.q) {
    const rx = new RegExp(escapeRegex(p.q), "i");
    filter.$or = [
      { scholarship_title: rx },
      { scholarship_description: rx },
      { scholarship_requirements: rx },
    ];
  }
  if (p.type) filter.scholarship_type = p.type;
  if (p.createdBy) filter.scholarship_CreatedBy = new RegExp(`^${escapeRegex(p.createdBy)}$`, "i");

  // value range
  if (p.minValue != null || p.maxValue != null) {
    filter.scholarship_value = {};
    if (p.minValue != null) filter.scholarship_value.$gte = p.minValue;
    if (p.maxValue != null) filter.scholarship_value.$lte = p.maxValue;
  }

  // applicant / applied
  if (p.applicant && typeof p.applied === "boolean") {
    const uid = (() => {
      try { return new ObjectId(p.applicant); } catch { return null; }
    })();
    if (uid) {
      filter.applicants = p.applied ? { $in: [uid] } : { $nin: [uid] };
    }
  }

  // Sorting
  let sort = { createdAt: -1 }; // default "recent"
  if (p.sort === "value_desc") sort = { scholarship_value: -1, createdAt: -1 };
  if (p.sort === "value_asc")  sort = { scholarship_value:  1, createdAt: -1 };

  const limit = p.limit ?? 20;

  const projection = {
    scholarship_title: 1,
    scholarship_description: 1,
    scholarship_requirements: 1,
    scholarship_CreatedBy: 1,
    scholarship_value: 1,
    scholarship_type: 1,
    applicants: 1,
    createdAt: 1,
    updatedAt: 1,
  };

  const items = await col.find(filter, { projection }).sort(sort).limit(limit).toArray();
  return items;
}

async function getScholarshipByTitle(args) {
  const p = Schemas.getScholarshipByTitle.parse(args);
  const db = await getDb();
  const col = db.collection("scholarships");

  const rx = new RegExp(`^${escapeRegex(p.title)}$`, "i");
  const doc = await col.findOne(
    { scholarship_title: rx },
    {
      projection: {
        scholarship_title: 1,
        scholarship_description: 1,
        scholarship_requirements: 1,
        scholarship_CreatedBy: 1,
        scholarship_value: 1,
        scholarship_type: 1,
        applicants: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  return doc || null;
}

async function listScholarshipsByType(args) {
  const p = Schemas.listScholarshipsByType.parse(args);
  const db = await getDb();
  const col = db.collection("scholarships");
  const limit = p.limit ?? 50;

  const items = await col
    .find(
      { scholarship_type: p.type },
      {
        projection: {
          scholarship_title: 1,
          scholarship_value: 1,
          scholarship_type: 1,
          scholarship_CreatedBy: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return items;
}

async function listScholarshipsByCreator(args) {
  const p = Schemas.listScholarshipsByCreator.parse(args);
  const db = await getDb();
  const col = db.collection("scholarships");
  const limit = p.limit ?? 50;

  const rx = new RegExp(`^${escapeRegex(p.createdBy)}$`, "i");

  const items = await col
    .find(
      { scholarship_CreatedBy: rx },
      {
        projection: {
          scholarship_title: 1,
          scholarship_value: 1,
          scholarship_type: 1,
          scholarship_CreatedBy: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return items;
}

async function getScholarshipApplicants(args) {
  const p = Schemas.getScholarshipApplicants.parse(args);
  const db = await getDb();
  const col = db.collection("scholarships");

  const rx = new RegExp(`^${escapeRegex(p.title)}$`, "i");
  const doc = await col.findOne(
    { scholarship_title: rx },
    { projection: { applicants: 1, scholarship_title: 1 } }
  );

  // Return IDs as strings for the model to render easily
  const ids = (doc?.applicants || []).map(a => a?.toString?.() || a);
  return { scholarship_title: doc?.scholarship_title || p.title, applicants: ids };
}

/* ============================ FAQs tools ============================ */

async function searchFaqs(args) {
  const p = Schemas.searchFaqs.parse(args);
  const db = await getDb();
  const col = db.collection("faqs");
  const k = Math.max(1, Math.min(p.limit ?? 10, 50));
  const qn = normalizeQ(p.q || "");
  if (!qn) {
    return await col.find({}, { projection: { _id: 0, question: 1, answer: 1, tags: 1 } })
                    .limit(k).toArray();
  }

  // 1) try text index (fast)
  let items = await col.find(
    { $text: { $search: qn } },
    { projection: { _id: 0, question: 1, answer: 1, tags: 1, score: { $meta: "textScore" } } }
  ).sort({ score: { $meta: "textScore" } }).limit(k).toArray();

  // 2) fallback: contains-all-tokens (regex) if text search misses
  if (!items.length) {
    const toks = qn.split(" ").filter(Boolean);
    const andRegex = toks.map(t => new RegExp(escapeRegex(t), "i"));
    items = await col.find(
      { $and: andRegex.map(rx => ({ $or: [{ question: rx }, { answer: rx }] })) },
      { projection: { _id: 0, question: 1, answer: 1, tags: 1 } }
    ).limit(50).toArray();
  }

  // 3) fuzzy rank (Levenshtein) to be typo-friendly
  items.sort((a, b) => {
    const da = levenshtein(normalizeQ(a.question), qn);
    const dbb = levenshtein(normalizeQ(b.question), qn);
    if (da !== dbb) return da - dbb;
    const da2 = levenshtein(normalizeQ(a.answer), qn);
    const db2 = levenshtein(normalizeQ(b.answer), qn);
    return da2 - db2;
  });

  return items.slice(0, k);
}

async function getFaqByQuestion(args) {
  const p = Schemas.getFaqByQuestion.parse(args);
  const db = await getDb();
  const rx = new RegExp(`^${escapeRegex(p.question)}$`, "i");
  const doc = await db.collection("faqs").findOne(
    { question: rx },
    { projection: { _id: 0, question: 1, answer: 1, tags: 1 } }
  );
  return doc || null;
}

/* ======================== TOOL EXEC MAP ======================== */

const TOOL_EXEC = {
  // existing:
  get_upcoming_events: getUpcomingEvents,
  search_programs: searchPrograms,

  // courses:
  search_courses: searchCourses,
  get_course_by_title: getCourseByTitle,
  list_courses_by_instructor: listCoursesByInstructor,
  list_courses_by_category: listCoursesByCategory,
  list_course_categories: listCourseCategories,

  // scholarships:
  search_scholarships: searchScholarships,
  get_scholarship_by_title: getScholarshipByTitle,
  list_scholarships_by_type: listScholarshipsByType,
  list_scholarships_by_creator: listScholarshipsByCreator,
  get_scholarship_applicants: getScholarshipApplicants,

  // faqs (new)
  search_faqs: searchFaqs,
  get_faq_by_question: getFaqByQuestion,
};

// ---------- Main handler ----------
exports.chatWithAgent = async (req, res) => {
  try {
    const userMsg = (req.body?.message || "").toString().slice(0, 2000);
    if (!userMsg) return res.status(400).json({ error: "message required" });

    const tools = defineTools();

    // 1) Ask model what to do (may propose a tool call)
    const first = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const msg = first.choices?.[0]?.message;

    // 2) If the model requested a tool, run it safely server-side
    if (msg?.tool_calls?.length) {
      const call = msg.tool_calls[0];
      const toolName = call.function.name;
      const args = JSON.parse(call.function.arguments || "{}");

      const fn = TOOL_EXEC[toolName];
      if (!fn) return res.json({ answer: "No tool available for this request." });

      const toolResult = await fn(args);

      // 3) Give results back to the model to format the final text
      const second = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
          msg,
          {
            role: "tool",
            tool_call_id: call.id,
            name: toolName,
            content: JSON.stringify(toolResult),
          },
        ],
        temperature: 0.2,
      });

      const answer = second.choices?.[0]?.message?.content?.trim() || "Done.";
      return res.json({ answer, data: toolResult });
    }

    // 3) No tool needed → answer directly (general site questions)
    const answer = msg?.content?.trim() || "How can I help?";
    return res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "agent_error", detail: String(e) });
  }
};
