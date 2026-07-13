// lib/questionBank.ts
//
// AGENT-SUGGEST delta (Wave 1): a flat, entity-tagged question bank — 5
// questions per onboarding life area (7 areas × 5 = 35). This is consumed by
// lib/suggestQuestions.ts, which does the scoring/ranking; this file only
// holds static content plus the chart entities ("houses"/"planets") each
// question is grounded in.
//
// Voice — Engine B (educational, agency-focused, anti-fatalist; see
// V2-MASTER-PROMPT.md §2.8): every question invites the chart to TEACH. None
// may promise prediction, timing of fated events, or flattery.
//   GOOD: "What does my 10th house say about the kind of work that energizes me?"
//   BAD:  "When will I get married?" → rewritten as
//         "What does my 7th house suggest about how I approach commitment?"
//
// Pure data — no imports from sweph, no DB, no fetch.

import type { GrahaId } from "@/lib/kb";
import type { LifeAreaId } from "@/lib/lifeAreas";

export interface QuestionEntities {
  houses?: number[];
  planets?: GrahaId[];
}

export interface BankQuestion {
  id: string;
  areaId: LifeAreaId;
  text: string;
  entities: QuestionEntities;
}

export const QUESTION_BANK: BankQuestion[] = [
  // ── love (7th/5th house, Venus/Mars/Moon) ──
  { id: "qb-love-1", areaId: "love", text: "What does my 7th house suggest about how I approach commitment?", entities: { houses: [7], planets: ["venus"] } },
  { id: "qb-love-2", areaId: "love", text: "How does my Venus placement shape what I need in a partnership?", entities: { planets: ["venus"] } },
  { id: "qb-love-3", areaId: "love", text: "What does my chart teach me about how I show affection?", entities: { houses: [5], planets: ["venus", "moon"] } },
  { id: "qb-love-4", areaId: "love", text: "How does Mars color the way I pursue or assert myself in romance?", entities: { houses: [7], planets: ["mars"] } },
  { id: "qb-love-5", areaId: "love", text: "What might my 5th house reveal about how I fall for someone?", entities: { houses: [5], planets: ["venus"] } },

  // ── career (10th/6th house, Saturn/Sun/Mercury) ──
  { id: "qb-career-1", areaId: "career", text: "What does my 10th house say about the kind of work that energizes me?", entities: { houses: [10] } },
  { id: "qb-career-2", areaId: "career", text: "How does my Saturn placement shape the discipline I bring to my work?", entities: { planets: ["saturn"], houses: [10] } },
  { id: "qb-career-3", areaId: "career", text: "What does my chart suggest about how I earn recognition?", entities: { houses: [10], planets: ["sun"] } },
  { id: "qb-career-4", areaId: "career", text: "How might my 6th house explain the way I handle daily work and service?", entities: { houses: [6] } },
  { id: "qb-career-5", areaId: "career", text: "What does Mercury's placement teach me about how I think through problems at work?", entities: { planets: ["mercury"], houses: [10] } },

  // ── health (1st/6th house, Sun/Moon/Mars) ──
  { id: "qb-health-1", areaId: "health", text: "What does my 1st house suggest about my baseline vitality?", entities: { houses: [1] } },
  { id: "qb-health-2", areaId: "health", text: "How does my 6th house describe the habits that keep me steady?", entities: { houses: [6] } },
  { id: "qb-health-3", areaId: "health", text: "What might my Moon placement teach me about my emotional and physical rhythms?", entities: { planets: ["moon"] } },
  { id: "qb-health-4", areaId: "health", text: "How does Mars show up in the way I channel or burn energy?", entities: { planets: ["mars"], houses: [6] } },
  { id: "qb-health-5", areaId: "health", text: "What does my chart suggest about where I tend to run down first?", entities: { houses: [6, 1] } },

  // ── money (2nd/11th house, Jupiter/Venus) ──
  { id: "qb-money-1", areaId: "money", text: "What does my 2nd house say about how I relate to accumulated resources?", entities: { houses: [2] } },
  { id: "qb-money-2", areaId: "money", text: "How does my 11th house describe where gains tend to come from?", entities: { houses: [11] } },
  { id: "qb-money-3", areaId: "money", text: "What does my Jupiter placement teach me about how I grow what I have?", entities: { planets: ["jupiter"], houses: [2] } },
  { id: "qb-money-4", areaId: "money", text: "How might Venus shape what I value enough to spend on?", entities: { planets: ["venus"] } },
  { id: "qb-money-5", areaId: "money", text: "What does my chart suggest about the difference between how I earn and how I save?", entities: { houses: [2, 11] } },

  // ── personality (1st house, Sun/Moon/Ascendant) ──
  { id: "qb-personality-1", areaId: "personality", text: "What does my Ascendant say about how I meet the world?", entities: { houses: [1] } },
  { id: "qb-personality-2", areaId: "personality", text: "How do my Sun and Moon pull in different directions?", entities: { planets: ["sun", "moon"] } },
  { id: "qb-personality-3", areaId: "personality", text: "What core temperament does my chart keep returning to?", entities: { houses: [1] } },
  { id: "qb-personality-4", areaId: "personality", text: "How does my Moon shape my inner emotional weather?", entities: { planets: ["moon"] } },
  { id: "qb-personality-5", areaId: "personality", text: "What does my chart suggest about how others tend to experience me first?", entities: { houses: [1], planets: ["sun"] } },

  // ── spiritual (9th/12th house, Jupiter/Ketu) ──
  { id: "qb-spiritual-1", areaId: "spiritual", text: "What does my 9th house point to as a source of meaning?", entities: { houses: [9] } },
  { id: "qb-spiritual-2", areaId: "spiritual", text: "What is my Ketu placement here to help me release?", entities: { planets: ["ketu"] } },
  { id: "qb-spiritual-3", areaId: "spiritual", text: "How does my 12th house describe the way I turn inward?", entities: { houses: [12] } },
  { id: "qb-spiritual-4", areaId: "spiritual", text: "What might Jupiter teach me about the beliefs I keep growing into?", entities: { planets: ["jupiter"], houses: [9] } },
  { id: "qb-spiritual-5", areaId: "spiritual", text: "What does my chart suggest about the difference between solitude and withdrawal, for me?", entities: { houses: [12] } },

  // ── learning (Mercury/Jupiter, 4th/5th/9th house) ──
  { id: "qb-learning-1", areaId: "learning", text: "What's a good first placement in my chart to learn to read?", entities: { houses: [1] } },
  { id: "qb-learning-2", areaId: "learning", text: "How does Mercury shape the way I take in and process information?", entities: { planets: ["mercury"] } },
  { id: "qb-learning-3", areaId: "learning", text: "What does my 9th house teach me about how I relate to higher learning?", entities: { houses: [9] } },
  { id: "qb-learning-4", areaId: "learning", text: "How do my planets, signs, and houses actually fit together?", entities: {} },
  { id: "qb-learning-5", areaId: "learning", text: "What does my current Mahadasha reveal about the lesson this chapter is teaching me?", entities: { houses: [5] } },
];
