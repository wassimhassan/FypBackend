// scripts/seedFaqs.js
require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!uri || !dbName) {
  console.error("Missing MONGO_URI or DB_NAME in .env");
  process.exit(1);
}

// ---- Edit/extend this array whenever you update FAQs ----
const faqs = [
  {
    question: "What is FEKRA?",
    answer:
      `"FEKRA" is a comprehensive educational project founded in 2021. It provides students with enhanced educational opportunities—especially specialized SAT preparation—along with developing writing skills, analytical thinking, and multilingualism.`,
    tags: ["about","overview"]
  },
  {
    question: "Who founded FEKRA?",
    answer: "FEKRA was founded by Ibrahim Mohammad and Al-Jalilah.",
    tags: ["about","founders"]
  },
  {
    question: "When was FEKRA founded?",
    answer: "FEKRA was founded in the year 2021.",
    tags: ["about","history"]
  },
  {
    question: "What is FEKRA’s main focus?",
    answer:
      "FEKRA focuses on education, offering specialized SAT preparation in Math and English, developing writing skills, fostering analytical thinking, and promoting multilingualism.",
    tags: ["focus","sat"]
  },
  {
    question: "What services does FEKRA offer for SAT?",
    answer:
      "Private lessons tailored to SAT preparation, with support through Zoom meetings, WhatsApp groups, practice tests, and lessons.",
    tags: ["sat","services"]
  },
  {
    question: "What clubs does FEKRA have?",
    answer:
      "Fakir Feha Podcast; FEKRA Impact Research Club; Psychology Club; English Club; Outlook Club; Programming Club.",
    tags: ["clubs","community"]
  },
  {
    question: "What is the aim of the podcast?",
    answer:
      "The podcast aims to interview people who made an impact in our communities.",
    tags: ["podcast","clubs"]
  },
  {
    question: "Which organizations has FEKRA collaborated with?",
    answer:
      "Palestinian Student Funds; ToRead; U-Link; Life Sculptor; Tawwoun; Young Take Action NGO; ULYP NGO; 01Tutor; Lion Lot; Don’t Forget; Leper X; Lebanese University; USJ University; PWHO; Leonard Education Organization; AGC; Injaz; LAU; AUB; BAU; EMU; Amidest; Harmony Smile Clinic.",
    tags: ["collaborations","partners"]
  },
  {
    question: "What recognition did FEKRA receive through entrepreneurship programs?",
    answer:
      "The founder participated in an Entrepreneurship Program with PsFund and ToRead, sponsored by Tawwoun; the project was recognized, leading to significant opportunities.",
    tags: ["achievement","entrepreneurship"]
  },
  {
    question: "What scholarships and fee support were provided in September 2023?",
    answer:
      "A donor chose FEKRA to nominate 10 students to cover SAT fees, and FEKRA could offer scholarships for students to study at the American University of Cairo (AUC) and the American University of Beirut (AUB), and NYU Abu Dhabi.",
    tags: ["scholarships","sat","support"]
  }
  // Add more Q&A from your text here whenever you like.
];

(async () => {
  const client = new MongoClient(uri, { maxPoolSize: 5 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("faqs");

    // indexes (idempotent)
    await col.createIndex({ question: 1 }, { unique: true });
    await col.createIndex(
      { question: "text", answer: "text", tags: "text" },
      { name: "faq_text_idx" }
    );

    // upsert each FAQ by question
    for (const f of faqs) {
      await col.updateOne(
        { question: f.question },
        { $set: { answer: f.answer, tags: f.tags || [], updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      console.log("Upserted:", f.question);
    }

    const count = await col.countDocuments();
    console.log(`Done. faqs collection count = ${count}`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
