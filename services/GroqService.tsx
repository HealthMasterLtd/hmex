/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Question {
  id: string;
  question: string;
  type: 'number' | 'yesno' | 'slider' | 'multiple' | 'text';
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
  required: boolean;
  aiGenerated: boolean;
  condition?: (answers: Answer[]) => boolean;
  tooltip?: string;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
  question: string;
}

export interface UserProfile {
  ageCategory: 'young-adult' | 'middle-aged' | 'older-adult';
  gender: 'male' | 'female';
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely-obese';
  waistCategory: 'normal' | 'elevated' | 'high' | 'very-high';
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  specificProfiles: ('family-history' | 'overweight' | 'previous-red-flags' | 'women-reproductive' | 'high-stress-occupation')[];
}

export interface DualRiskAssessment {
  diabetesRisk: {
    level: 'low' | 'slightly-elevated' | 'moderate' | 'high' | 'very-high';
    score: number;
    percentage: string;
    pointsBreakdown: Record<string, number>;
  };
  hypertensionRisk: {
    level: 'low' | 'slightly-elevated' | 'moderate' | 'high' | 'very-high';
    score: number;
    percentage: string;
    pointsBreakdown: Record<string, number>;
  };
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  urgentActions?: string[];
  detailedAnalysis?: string;
  profile: UserProfile;
}

// ─── WAIST OPTIONS (exported for UI) ──────────────────────────────────────────
export const WAIST_OPTIONS = [
  { value: 'Slim waist',       img: '/assets/images/waist1.png', label: 'Slim',       hint: 'Waist <80 cm (women) / <94 cm (men)' },
  { value: 'Moderate waist',   img: '/assets/images/waist2.png', label: 'Average',    hint: 'Waist 80-88 cm (women) / 94-102 cm (men)' },
  { value: 'Large waist',      img: '/assets/images/waist3.png', label: 'Large',      hint: 'Waist 88-100 cm (women) / 102-115 cm (men)' },
  { value: 'Very large waist', img: '/assets/images/waist4.png', label: 'Very Large', hint: 'Waist >100 cm (women) / >115 cm (men)' },
];

// ─── BASELINE: always first 4 questions, fixed ────────────────────────────────
const BASELINE: Question[] = [
  {
    id: 'age',
    question: 'How old are you?',
    type: 'slider', min: 18, max: 100, unit: 'years',
    required: true, aiGenerated: false,
    tooltip: 'Risk for diabetes and hypertension rises sharply after age 45.',
  },
  {
    id: 'gender',
    question: 'What is your biological sex?',
    type: 'multiple', options: ['Male', 'Female'],
    required: true, aiGenerated: false,
    tooltip: 'Biological sex affects which risk factors to screen for most closely.',
  },
  {
    id: 'height_weight',
    question: 'What is your height and weight?',
    type: 'text',
    required: true, aiGenerated: false,
    tooltip: 'Your BMI is one of the strongest predictors of metabolic disease risk.',
  },
  {
    id: 'waist_circumference',
    question: 'Which image best matches your body shape?',
    type: 'multiple', options: ['Slim waist', 'Moderate waist', 'Large waist', 'Very large waist'],
    required: true, aiGenerated: false,
    tooltip: 'Central belly fat is more dangerous than overall weight for both diabetes and blood pressure.',
  },
];

// ─── CRITICAL CLINICALS: Must be asked at specific slots ──────────────────────
interface CriticalQ extends Question { injectAtSlot: number; }

const CRITICAL_CLINICALS: CriticalQ[] = [
  {
    id: 'family_history_diabetes',
    injectAtSlot: 6,
    question: 'Has anyone in your close family been diagnosed with diabetes?',
    type: 'multiple',
    options: ['No', 'Yes — grandparent, aunt, uncle, or cousin', 'Yes — parent, sibling, or child', 'Yes — multiple close relatives'],
    required: true, aiGenerated: false,
    tooltip: 'Family history is one of the strongest diabetes risk factors.',
  },
  {
    id: 'blood_pressure_history',
    injectAtSlot: 8,
    question: 'Has a doctor ever told you that you have high blood pressure, or have you taken medication for it?',
    type: 'multiple',
    options: ['No, never', 'Yes — told I have high BP but not on medication', 'Yes — currently taking BP medication', 'Yes — was on medication but stopped', "Don't know / Not sure"],
    required: true, aiGenerated: false,
    tooltip: 'Previous high BP diagnosis is the strongest hypertension predictor.',
  },
  {
    id: 'previous_high_glucose',
    injectAtSlot: 10,
    question: 'Have you ever been told your blood sugar was too high — during a check-up, illness, or pregnancy?',
    type: 'multiple',
    options: ['No, never', 'Yes — once, during illness or stress', 'Yes — diagnosed with prediabetes', 'Yes — during pregnancy (gestational diabetes)', 'Yes — multiple times but no formal diagnosis'],
    required: true, aiGenerated: false,
    tooltip: 'Past glucose elevations are strong predictors of future diabetes.',
  },
  {
    id: 'physical_activity',
    injectAtSlot: 12,
    question: 'Do you do at least 30 minutes of physical activity most days of the week?',
    type: 'yesno', options: ['Yes', 'No'],
    required: true, aiGenerated: false,
    tooltip: 'Regular movement is one of the most powerful protective factors.',
  },
];

// ─── STATIC FALLBACK BANK (randomized each session) ──────────────────────────
// NOTE: Food references use universal language — green bananas, starchy staples,
// cooked leafy greens — rather than region-specific names.
const FALLBACK_BANK: Question[] = [
  {
    id: 'vegetables_fruits',
    question: 'Do you eat vegetables, fruits, or leafy greens every day?',
    type: 'yesno', options: ['Yes', 'No'],
    required: true, aiGenerated: false,
  },
  {
    id: 'salt_intake',
    question: 'How would you describe your salt intake?',
    type: 'multiple',
    options: ['Low — I rarely add salt', 'Moderate — sometimes', 'High — I regularly add salt', 'Very high — salt on almost every meal'],
    required: false, aiGenerated: false,
  },
  {
    id: 'sugary_drinks',
    question: 'How often do you drink soda, sweetened juice, or energy drinks?',
    type: 'multiple',
    options: ['Rarely or never', '1-3 times per week', '4-6 times per week', 'Once daily', 'Multiple times per day'],
    required: false, aiGenerated: false,
  },
  {
    id: 'sleep_duration',
    question: 'How many hours of sleep do you typically get per night?',
    type: 'multiple',
    options: ['Less than 5 hours', '5-6 hours', '7-8 hours (optimal)', 'More than 9 hours'],
    required: false, aiGenerated: false,
  },
  {
    id: 'stress_level',
    question: 'How would you describe your stress level most days?',
    type: 'multiple',
    options: ['Low — calm most of the time', 'Moderate — manageable', 'High — frequently overwhelmed', 'Severe — constant unmanageable stress'],
    required: false, aiGenerated: false,
  },
  {
    id: 'smoking',
    question: 'Do you smoke cigarettes or use tobacco products?',
    type: 'multiple',
    options: ['No, never smoked', 'No, quit more than 5 years ago', 'No, quit 1-5 years ago', 'Yes, occasionally', 'Yes, daily'],
    required: false, aiGenerated: false,
  },
  {
    id: 'alcohol',
    question: 'How often do you drink alcohol?',
    type: 'multiple',
    options: ['Never / Rarely', '1-2 times per month', '1-2 times per week', '3-4 times per week', 'Daily'],
    required: false, aiGenerated: false,
  },
  {
    id: 'family_history_hypertension',
    question: 'Has anyone in your family been diagnosed with high blood pressure?',
    type: 'multiple',
    options: ['No', 'Yes — grandparent, aunt, uncle, or cousin', 'Yes — parent, sibling, or child', 'Yes — multiple close relatives', "Don't know"],
    required: true, aiGenerated: false,
  },
  {
    id: 'occupation',
    question: 'Which best describes your typical work day?',
    type: 'multiple',
    options: ['Mostly sitting (desk / driving)', 'Mix of sitting and moving', 'Mostly standing or walking', 'Heavy physical labour', 'Not currently working'],
    required: false, aiGenerated: false,
  },
  {
    id: 'processed_foods',
    question: 'How often do you eat fried or heavily processed foods?',
    type: 'multiple',
    options: ['Rarely (less than once a week)', '1-2 times per week', '3-4 times per week', 'Daily'],
    required: false, aiGenerated: false,
  },
  {
    id: 'water_intake',
    question: 'How much water do you typically drink per day?',
    type: 'multiple',
    options: ['Less than 1 litre', '1-2 litres', '2-3 litres', 'More than 3 litres'],
    required: false, aiGenerated: false,
  },
  {
    id: 'anxiety',
    question: 'Do you frequently feel anxious or on edge most days?',
    type: 'multiple',
    options: ['Rarely or never', 'Sometimes', 'Often (several days a week)', 'Very often (most days)'],
    required: false, aiGenerated: false,
  },
  {
    id: 'sleep_apnea',
    question: 'Has anyone told you that you snore loudly or stop breathing during sleep?',
    type: 'multiple',
    options: ['No', 'Yes — I snore loudly', "Yes — I've been told I stop breathing or gasp", 'Not sure'],
    required: false, aiGenerated: false,
    condition: (answers) => {
      const hw = String(answers.find(a => a.questionId === 'height_weight')?.value || '');
      try { const [h, w] = hw.split('/').map(Number); return w / ((h / 100) ** 2) >= 28; } catch { return false; }
    },
  },
  {
    id: 'pcos',
    question: 'Have you been diagnosed with Polycystic Ovary Syndrome (PCOS)?',
    type: 'multiple', options: ['Yes', 'No', 'Not sure'],
    required: false, aiGenerated: false,
    condition: (a) => a.find(x => x.questionId === 'gender')?.value === 'Female' && Number(a.find(x => x.questionId === 'age')?.value) <= 50,
  },
  {
    id: 'kidney_disease',
    question: 'Have you ever been diagnosed with kidney disease or kidney problems?',
    type: 'multiple', options: ['Yes', 'No', 'Not sure'],
    required: false, aiGenerated: false,
    condition: (a) => Number(a.find(x => x.questionId === 'age')?.value) >= 50,
  },
  {
    id: 'preeclampsia',
    question: 'Were you ever diagnosed with high blood pressure during pregnancy (preeclampsia)?',
    type: 'multiple', options: ['Yes', 'No', 'Not sure', 'Never pregnant'],
    required: false, aiGenerated: false,
    condition: (a) => a.find(x => x.questionId === 'gender')?.value === 'Female',
  },
  {
    id: 'medications',
    question: 'Do you regularly take any of these medications?',
    type: 'multiple',
    options: ['Oral contraceptives (birth control pills)', 'NSAIDs / pain relievers regularly', 'Steroids (prednisone, etc.)', 'Antidepressants', 'None of these'],
    required: false, aiGenerated: false,
    condition: (a) => a.find(x => x.questionId === 'gender')?.value === 'Female',
  },
  // ── Additional questions for greater randomization ──
  {
    id: 'starchy_staples',
    question: 'How much of your main meals consist of starchy foods (cooked grains, starchy vegetables, bread)?',
    type: 'multiple',
    options: ['A small portion — most of my plate is vegetables or protein', 'About half my plate', 'More than half my plate', 'Almost the entire meal'],
    required: false, aiGenerated: false,
  },
  {
    id: 'red_meat',
    question: 'How often do you eat red or processed meats (beef, pork, sausages, salted dried meat)?',
    type: 'multiple',
    options: ['Rarely or never', '1-2 times per week', '3-4 times per week', 'Daily'],
    required: false, aiGenerated: false,
  },
  {
    id: 'legumes_frequency',
    question: 'How often do you eat beans, lentils, or peas?',
    type: 'multiple',
    options: ['Rarely or never', 'A few times per month', '2-3 times per week', 'Most days'],
    required: false, aiGenerated: false,
  },
  {
    id: 'cooking_oil',
    question: 'What type of fat or oil do you mainly use for cooking?',
    type: 'multiple',
    options: ['Vegetable or sunflower oil', 'Palm oil', 'Butter or ghee', 'Animal fat / lard', 'Mostly no added fat'],
    required: false, aiGenerated: false,
  },
  {
    id: 'meal_frequency',
    question: 'How many meals do you typically eat per day?',
    type: 'multiple',
    options: ['1 meal', '2 meals', '3 meals', '4 or more meals including snacks'],
    required: false, aiGenerated: false,
  },
  {
    id: 'weight_change',
    question: 'Has your weight changed noticeably in the past 2 years?',
    type: 'multiple',
    options: ['No, it has stayed about the same', 'Yes — I have gained weight', 'Yes — I have lost weight (intentionally)', 'Yes — I have lost weight (unintentionally)'],
    required: false, aiGenerated: false,
  },
  {
    id: 'thirst_urination',
    question: 'Do you often feel very thirsty or need to urinate frequently, especially at night?',
    type: 'multiple',
    options: ['No, not at all', 'Occasionally', 'Yes, often', 'Yes, almost every night'],
    required: false, aiGenerated: false,
    condition: (a) => Number(a.find(x => x.questionId === 'age')?.value) >= 35,
  },
  {
    id: 'fatigue_after_meals',
    question: 'Do you feel unusually tired or sleepy after eating?',
    type: 'multiple',
    options: ['Rarely or never', 'Sometimes (once or twice a week)', 'Often (most days)', 'Almost always after every meal'],
    required: false, aiGenerated: false,
  },
  {
    id: 'morning_headaches',
    question: 'Do you experience headaches or neck tightness in the morning?',
    type: 'multiple',
    options: ['Never', 'Occasionally (once a month)', 'Often (several times a week)', 'Almost every morning'],
    required: false, aiGenerated: false,
  },
  {
    id: 'last_health_check',
    question: 'When did you last have your blood pressure or blood sugar checked by a health worker?',
    type: 'multiple',
    options: ['Within the last 6 months', '6-12 months ago', '1-3 years ago', 'More than 3 years ago', 'Never checked'],
    required: false, aiGenerated: false,
  },
  {
    id: 'cholesterol_history',
    question: 'Have you ever been told you have high cholesterol?',
    type: 'multiple',
    options: ['No', 'Yes — and I am managing it', 'Yes — but I am not on treatment', 'Never been tested'],
    required: false, aiGenerated: false,
    condition: (a) => Number(a.find(x => x.questionId === 'age')?.value) >= 40,
  },
  {
    id: 'screen_time',
    question: 'How many hours per day do you typically spend sitting (work, TV, phone)?',
    type: 'multiple',
    options: ['Less than 4 hours', '4-6 hours', '6-9 hours', 'More than 9 hours'],
    required: false, aiGenerated: false,
  },
];

// ─── SHUFFLE UTILITY ──────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────
class GroqService {
  private answers: Answer[] = [];
  private questionCount = 0;
  private usedIds = new Set<string>();
  private readonly MAX_Q = 14;
  private readonly API_KEY: string;
  private readonly MODEL = 'llama-3.3-70b-versatile';
  private profile: UserProfile | null = null;

  // Shuffled fallback order — randomized fresh each session
  private shuffledFallback: Question[] = [];

  constructor() {
    this.API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
    this.shuffledFallback = shuffleArray(FALLBACK_BANK);
    console.log(this.API_KEY ? '✅ Groq AI ready' : '⚠️ No Groq API key — using static fallback');
  }

  // ─── MAIN ENTRY ───────────────────────────────────────────────────────────

  async getNextQuestion(): Promise<Question | null> {
    if (this.questionCount >= this.MAX_Q) return null;

    // ── Phase 1: Baseline (slots 1-4) ──
    if (this.questionCount < 4) {
      return this.serveBaseline();
    }

    // Build profile once
    if (!this.profile) {
      this.profile = this.buildProfile();
      console.log('👤 Profile:', this.profile);
    }

    // ── Phase 2: From slot 5 onwards ──
    const currentSlot = this.questionCount + 1;

    // Check if a critical question is due at this exact slot
    const dueCritical = CRITICAL_CLINICALS.find(
      q => !this.usedIds.has(q.id) && q.injectAtSlot <= currentSlot
    );
    if (dueCritical) {
      this.usedIds.add(dueCritical.id);
      this.questionCount++;
      console.log(`📌 Critical injection at slot ${currentSlot}: ${dueCritical.id}`);
      return dueCritical;
    }

    // ── Phase 3: AI-generated question ──
    if (this.API_KEY) {
      try {
        const aiQ = await this.generateAIQuestion();
        if (aiQ) return aiQ;
      } catch (e) {
        console.error('AI question failed:', e);
      }
    }

    // ── Phase 4: Static fallback (shuffled) ──
    return this.serveFallback();
  }

  // ─── BASELINE ─────────────────────────────────────────────────────────────

  private serveBaseline(): Question {
    const q = { ...BASELINE[this.questionCount] };
    this.usedIds.add(q.id);
    this.questionCount++;
    return q;
  }

  // ─── AI QUESTION ──────────────────────────────────────────────────────────

  private async generateAIQuestion(): Promise<Question | null> {
    const age = Number(this.ans('age')) || 0;
    const gender = String(this.ans('gender') || '');
    const bmi = this.calcBMI();
    const waist = String(this.ans('waist_circumference') || '');
    const prelim = this.calcPrelimRisk();
    const slotsLeft = this.MAX_Q - this.questionCount;

    const pendingCriticalIds = CRITICAL_CLINICALS
      .filter(q => !this.usedIds.has(q.id))
      .map(q => q.id)
      .join(', ');

    const answeredSummary = this.answers
      .map(a => `  • ${a.question}: "${a.value}"`)
      .join('\n');

    const alreadyAsked = Array.from(this.usedIds).join(', ');

    const prompt = `You are a clinical AI conducting a personalised diabetes and hypertension risk screening interview.

═══ PATIENT SNAPSHOT ═══
Age: ${age} yrs | Gender: ${gender} | BMI: ${bmi.toFixed(1)} | Waist: ${waist}
Diabetes risk level: ${prelim.dLevel} (score: ${prelim.dScore})
Hypertension risk level: ${prelim.hLevel} (score: ${prelim.hScore})
Risk concerns so far: ${prelim.concerns.join(', ') || 'none yet'}
Questions answered so far: ${this.questionCount} | Slots remaining: ${slotsLeft}

═══ ALL ANSWERS SO FAR ═══
${answeredSummary || '  (only baseline questions answered)'}

═══ DO NOT ASK (already covered) ═══
${alreadyAsked}

═══ WILL BE ASKED SEPARATELY (do not duplicate) ═══
${pendingCriticalIds || 'none'}

═══ YOUR TASK ═══
Generate ONE highly personalised clinical question for THIS specific patient.

Rules:
- MUST target the single most clinically valuable unknown right now
- MUST be genuinely personalised to their age, gender, BMI, waist, and prior answers
- MUST NOT repeat or overlap any question already asked
- MUST NOT ask about: ${alreadyAsked}
- Should feel like a real doctor asking a follow-up — not a generic survey
- Conversational phrasing, max 18 words
- Use UNIVERSAL food language: say "starchy staples" not matoke or ugali specifically; say "green bananas" not matoke; say "cooked leafy greens" not sukuma wiki specifically; say "fermented milk" not specific brand names
- Food examples you MAY mention: beans, lentils, green bananas, sweet potatoes, cassava, cooked leafy greens, whole grains, sorghum, millet, groundnuts

For a ${age}yr ${gender} with BMI ${bmi.toFixed(1)} and ${prelim.dLevel} diabetes / ${prelim.hLevel} hypertension risk, the most clinically valuable questions are about:
${this.getAIPriorityAreas(age, gender, bmi, waist, prelim)}

Respond ONLY with valid JSON (no markdown, no backticks, no explanation):
{
  "question": "Your personalised question text?",
  "type": "multiple" | "yesno" | "slider",
  "options": ["Option 1", "Option 2", "Option 3"],
  "reasoning": "one sentence clinical rationale"
}
Note: for yesno, options must be exactly ["Yes","No"]. For slider, add "min", "max", "unit" fields.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          { role: 'system', content: 'You are a clinical AI for metabolic disease screening. Output ONLY valid JSON. No other text whatsoever.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.92,
        max_tokens: 380,
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const raw: string = data.choices[0].message.content.trim();
    console.log('🤖 Raw AI response:', raw);
    return this.parseAI(raw);
  }

  private getAIPriorityAreas(age: number, gender: string, bmi: number, waist: string, prelim: any): string {
    const lines: string[] = [];

    // Core universal areas — always valuable
    lines.push('- Diet quality: proportion of starchy staples (cooked grains, cassava, green bananas, sweet potatoes) vs vegetables and protein');
    lines.push('- Sugary drinks frequency: soda, sweetened juice or tea, energy drinks');
    lines.push('- Salt habits: adding salt to food, eating salty snacks, processed or preserved foods daily');

    if (bmi >= 28 || waist === 'Large waist' || waist === 'Very large waist') {
      lines.push('- Sleep quality: restless sleep, waking at night, loud snoring');
      lines.push('- Weight history: gained weight recently and over how many years');
      lines.push('- Emotional eating: does stress trigger overeating or poor food choices');
    }

    if (age >= 40) {
      lines.push('- Diabetes warning signs: urinating frequently at night, excessive thirst, fatigue after meals, blurred vision, slow wound healing');
      lines.push('- Hypertension warning signs: morning headaches, dizziness when standing, neck tightness, palpitations');
      lines.push('- Screening history: when they last had blood sugar or blood pressure checked at a health facility');
    }

    if (age >= 50) {
      lines.push('- Kidney health: any kidney problems, swollen ankles, unusual changes in urine');
      lines.push('- Cholesterol: ever been told they have high cholesterol or abnormal blood fats');
      lines.push('- Family cardiovascular history: any sibling or parent who died early from heart attack or stroke');
    }

    if (gender === 'Female') {
      lines.push('- PCOS: irregular periods, difficulty losing weight, excess facial hair');
      lines.push('- Pregnancy history: high blood pressure or high blood sugar during pregnancy');
      lines.push('- Hormonal contraception: current or past use of birth control pills');
    }

    if (prelim.dScore >= 12) {
      lines.push('- Diabetes-specific deep dive: sweet food cravings, tingling or numbness in feet or hands, slow wound healing');
    }

    if (prelim.hScore >= 12) {
      lines.push('- Hypertension-specific deep dive: frequency of blood pressure self-monitoring, palpitations, shortness of breath on exertion');
    }

    lines.push('- Physical activity details: type, frequency, and any barriers to exercising');
    lines.push('- Alcohol: frequency and quantity per sitting');
    lines.push('- Tobacco: current or past use');
    lines.push('- Stress and mental health: work pressure, financial stress, sleep disrupted by worry');
    lines.push('- Legume consumption: how often they eat beans, lentils, or peas');
    lines.push('- Cooking practices: main fat used for cooking, how food is typically prepared');

    // Return most relevant 8 areas (randomize slightly to vary questions between sessions)
    const shuffled = shuffleArray(lines);
    return shuffled.slice(0, 8).join('\n');
  }

  private parseAI(raw: string): Question | null {
    try {
      const clean = raw.replace(/```json|```/gi, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object found');
      const p = JSON.parse(match[0]);
      if (!p.question || !p.type) throw new Error('Missing fields');

      const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const q: Question = { id, question: p.question, type: p.type, required: true, aiGenerated: true };

      if (p.type === 'multiple' && Array.isArray(p.options)) q.options = p.options;
      if (p.type === 'yesno') q.options = ['Yes', 'No'];
      if (p.type === 'slider') {
        q.min = typeof p.min === 'number' ? p.min : 0;
        q.max = typeof p.max === 'number' ? p.max : 10;
        q.unit = p.unit || '';
      }

      console.log(`✨ AI Q: "${q.question}" [${q.type}] — Reason: ${p.reasoning || 'N/A'}`);
      this.usedIds.add(id);
      this.questionCount++;
      return q;
    } catch (e) {
      console.error('AI parse error:', e, '\nRaw was:', raw);
      return null;
    }
  }

  // ─── STATIC FALLBACK (shuffled, condition-aware) ───────────────────────────

  private serveFallback(): Question | null {
    // "Required" questions first, then others — all from the pre-shuffled order
    const required = this.shuffledFallback.filter(
      q => !this.usedIds.has(q.id) && q.required && (!q.condition || q.condition(this.answers))
    );
    const optional = this.shuffledFallback.filter(
      q => !this.usedIds.has(q.id) && !q.required && (!q.condition || q.condition(this.answers))
    );

    const candidate = required[0] ?? optional[0] ?? null;
    if (!candidate) return null;

    this.usedIds.add(candidate.id);
    this.questionCount++;
    return candidate;
  }

  // ─── PROFILE ──────────────────────────────────────────────────────────────

  private buildProfile(): UserProfile {
    const age = Number(this.ans('age')) || 0;
    const gender = (String(this.ans('gender') || '').toLowerCase()) as 'male' | 'female';
    const bmi = this.calcBMI();
    const waist = String(this.ans('waist_circumference') || '');

    const ageCategory: UserProfile['ageCategory'] = age < 35 ? 'young-adult' : age < 55 ? 'middle-aged' : 'older-adult';
    const bmiCategory: UserProfile['bmiCategory'] =
      bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : bmi < 35 ? 'obese' : 'severely-obese';
    const waistCategory: UserProfile['waistCategory'] =
      waist === 'Slim waist' ? 'normal' : waist === 'Moderate waist' ? 'elevated' : waist === 'Large waist' ? 'high' : 'very-high';

    const specificProfiles: UserProfile['specificProfiles'] = [];
    if (bmi >= 25) specificProfiles.push('overweight');
    if (gender === 'female' && age >= 18 && age <= 50) specificProfiles.push('women-reproductive');

    return { ageCategory, gender, bmiCategory, waistCategory, riskLevel: 'low', specificProfiles };
  }

  // ─── PRELIMINARY RISK ─────────────────────────────────────────────────────

  private calcPrelimRisk() {
    const age = Number(this.ans('age')) || 0;
    const bmi = this.calcBMI();
    const gender = String(this.ans('gender') || '');
    const waist = String(this.ans('waist_circumference') || '');
    let dScore = 0, hScore = 0;
    const concerns: string[] = [];

    if (age >= 55) { dScore += 6; hScore += 8; concerns.push('Age 55+'); }
    else if (age >= 45) { dScore += 4; hScore += 5; }
    else if (age >= 35) { dScore += 2; hScore += 3; }

    if (bmi >= 35) { dScore += 7; hScore += 8; concerns.push('Severe obesity'); }
    else if (bmi >= 30) { dScore += 5; hScore += 5; concerns.push('Obesity'); }
    else if (bmi >= 25) { dScore += 3; hScore += 3; concerns.push('Overweight'); }

    if (waist === 'Very large waist') { dScore += 5; hScore += 5; concerns.push('Central obesity'); }
    else if (waist === 'Large waist') { dScore += 3; hScore += 4; }

    if (gender === 'Male') hScore += 1;

    const fDiab = this.ans('family_history_diabetes');
    if (fDiab && fDiab !== 'No') { dScore += 4; concerns.push('Family hx diabetes'); }

    const bpHx = this.ans('blood_pressure_history');
    if (bpHx && bpHx !== 'No, never' && bpHx !== "Don't know / Not sure") { hScore += 5; concerns.push('Prior high BP'); }

    const prevG = this.ans('previous_high_glucose');
    if (prevG && prevG !== 'No, never') { dScore += 5; concerns.push('Previous high glucose'); }

    const activity = this.ans('physical_activity');
    if (activity === 'No' || activity === false) { dScore += 2; hScore += 3; }

    const dLevel = dScore >= 18 ? 'high' : dScore >= 12 ? 'moderate' : dScore >= 7 ? 'slightly-elevated' : 'low';
    const hLevel = hScore >= 21 ? 'high' : hScore >= 14 ? 'moderate' : hScore >= 8 ? 'slightly-elevated' : 'low';
    return { dScore, hScore, dLevel, hLevel, concerns };
  }

  // ─── BMI ──────────────────────────────────────────────────────────────────

  private calcBMI(): number {
    const hw = String(this.ans('height_weight') || '');
    try { const [h, w] = hw.split('/').map(Number); if (h > 0 && w > 0) return w / ((h / 100) ** 2); } catch { /* */ }
    return 0;
  }

  // ─── SAVE ANSWER ──────────────────────────────────────────────────────────

  saveAnswer(q: Question, value: string | number | boolean): void {
    this.answers = this.answers.filter(a => a.questionId !== q.id);
    this.answers.push({ questionId: q.id, value, question: q.question });
    if (!this.profile && this.questionCount >= 4) this.profile = this.buildProfile();
  }

  // ─── GENERATE FULL ASSESSMENT ─────────────────────────────────────────────

  async generateRiskAssessment(): Promise<DualRiskAssessment> {
    const d = this.calcDiabetesRisk();
    const h = this.calcHypertensionRisk();
    const base = this.assembleAssessment(d, h);
    if (this.API_KEY) {
      try { return await this.aiEnhanceAssessment(base); } catch { /* */ }
    }
    return base;
  }

  private calcDiabetesRisk() {
    let score = 0;
    const bd: Record<string, number> = {};
    const age = Number(this.ans('age')) || 0;

    if (age >= 64) { score += 6; bd.age = 6; }
    else if (age >= 55) { score += 5; bd.age = 5; }
    else if (age >= 45) { score += 4; bd.age = 4; }
    else if (age >= 35) { score += 2; bd.age = 2; }

    const bmi = this.calcBMI();
    if (bmi >= 35) { score += 7; bd.bmi = 7; }
    else if (bmi >= 30) { score += 5; bd.bmi = 5; }
    else if (bmi >= 25) { score += 3; bd.bmi = 3; }

    const waist = String(this.ans('waist_circumference') || '');
    if (waist === 'Very large waist') { score += 5; bd.waist = 5; }
    else if (waist === 'Large waist') { score += 4; bd.waist = 4; }
    else if (waist === 'Moderate waist') { score += 2; bd.waist = 2; }

    const activity = this.ans('physical_activity');
    if (activity === 'No' || activity === false) { score += 2; bd.physical_activity = 2; }

    const veggies = this.ans('vegetables_fruits');
    if (veggies === 'No' || veggies === false) { score += 1; bd.vegetables_fruits = 1; }

    const fDiab = this.ans('family_history_diabetes');
    if (fDiab === 'Yes — parent, sibling, or child' || fDiab === 'Yes — multiple close relatives') { score += 5; bd.family_history = 5; }
    else if (fDiab === 'Yes — grandparent, aunt, uncle, or cousin') { score += 3; bd.family_history = 3; }

    const prevG = this.ans('previous_high_glucose');
    if (prevG === 'Yes — diagnosed with prediabetes' || prevG === 'Yes — during pregnancy (gestational diabetes)') { score += 8; bd.prev_glucose = 8; }
    else if (prevG === 'Yes — multiple times but no formal diagnosis') { score += 6; bd.prev_glucose = 6; }
    else if (prevG === 'Yes — once, during illness or stress') { score += 3; bd.prev_glucose = 3; }

    const pcos = this.ans('pcos'); if (pcos === 'Yes') { score += 3; bd.pcos = 3; }

    const bpHx = this.ans('blood_pressure_history');
    if (bpHx && bpHx !== 'No, never' && bpHx !== "Don't know / Not sure") { score += 2; bd.bp_hx = 2; }

    const salt = String(this.ans('salt_intake') || '');
    if (salt.startsWith('Very high')) { score += 1; bd.salt = 1; }

    const sugary = this.ans('sugary_drinks');
    if (sugary === 'Multiple times per day') { score += 2; bd.sugary = 2; }
    else if (sugary === 'Once daily') { score += 1; bd.sugary = 1; }

    const stress = this.ans('stress_level');
    if (stress === 'Severe — constant unmanageable stress') { score += 2; bd.stress = 2; }
    else if (stress === 'High — frequently overwhelmed') { score += 1; bd.stress = 1; }

    // Extra signals from expanded bank
    const starchy = this.ans('starchy_staples');
    if (starchy === 'Almost the entire meal') { score += 2; bd.starchy_staples = 2; }
    else if (starchy === 'More than half my plate') { score += 1; bd.starchy_staples = 1; }

    const legumes = this.ans('legumes_frequency');
    if (legumes === 'Rarely or never') { score += 1; bd.legumes = 1; }

    const fatigue = this.ans('fatigue_after_meals');
    if (fatigue === 'Often (most days)' || fatigue === 'Almost always after every meal') { score += 1; bd.fatigue = 1; }

    const thirst = this.ans('thirst_urination');
    if (thirst === 'Yes, almost every night') { score += 2; bd.thirst = 2; }
    else if (thirst === 'Yes, often') { score += 1; bd.thirst = 1; }

    const weightChange = this.ans('weight_change');
    if (weightChange === 'Yes — I have gained weight') { score += 1; bd.weight_change = 1; }

    const adj = score + (age >= 55 ? 2 : 0);
    let level: DualRiskAssessment['diabetesRisk']['level'];
    let percentage: string;
    if (adj >= 24) { level = 'very-high'; percentage = '>40% — possible undiagnosed diabetes'; }
    else if (adj >= 18) { level = 'high'; percentage = '20-40%'; }
    else if (adj >= 13) { level = 'moderate'; percentage = '10-20%'; }
    else if (adj >= 8) { level = 'slightly-elevated'; percentage = '5-10%'; }
    else { level = 'low'; percentage = '<5%'; }

    return { score, level, percentage, pointsBreakdown: bd };
  }

  private calcHypertensionRisk() {
    let score = 0;
    const bd: Record<string, number> = {};
    const age = Number(this.ans('age')) || 0;

    if (age >= 65) { score += 8; bd.age = 8; }
    else if (age >= 55) { score += 6; bd.age = 6; }
    else if (age >= 45) { score += 4; bd.age = 4; }
    else if (age >= 35) { score += 2; bd.age = 2; }

    const gender = String(this.ans('gender') || '');
    if (gender === 'Male') { score += 1; bd.gender = 1; }
    else if (gender === 'Female' && age > 55) { score += 2; bd.gender = 2; }

    const bmi = this.calcBMI();
    if (bmi >= 35) { score += 8; bd.bmi = 8; }
    else if (bmi >= 30) { score += 5; bd.bmi = 5; }
    else if (bmi >= 25) { score += 3; bd.bmi = 3; }

    const waist = String(this.ans('waist_circumference') || '');
    if (waist === 'Very large waist') { score += 5; bd.waist = 5; }
    else if (waist === 'Large waist') { score += 4; bd.waist = 4; }

    const activity = this.ans('physical_activity');
    if (activity === 'No' || activity === false) { score += 3; bd.physical_activity = 3; }

    const veggies = this.ans('vegetables_fruits');
    if (veggies === 'No' || veggies === false) { score += 2; bd.vegetables_fruits = 2; }

    const fHtn = this.ans('family_history_hypertension');
    if (fHtn === 'Yes — parent, sibling, or child' || fHtn === 'Yes — multiple close relatives' ||
        fHtn === 'Yes — parent / sibling / child' || fHtn === 'Yes — multiple relatives') { score += 5; bd.fam_htn = 5; }
    else if (typeof fHtn === 'string' && fHtn.startsWith('Yes —')) { score += 2; bd.fam_htn = 2; }

    const bpHx = this.ans('blood_pressure_history');
    let autoOverride: string | undefined;
    if (bpHx === 'Yes — currently taking BP medication') { autoOverride = 'ON_MEDS'; score += 6; bd.bp_hx = 6; }
    else if (bpHx === 'Yes — was on medication but stopped') { autoOverride = 'STOPPED_MEDS'; score += 7; bd.bp_hx = 7; }
    else if (bpHx === 'Yes — told I have high BP but not on medication') { score += 5; bd.bp_hx = 5; }

    const salt = String(this.ans('salt_intake') || '');
    if (salt.startsWith('Very high')) { score += 5; bd.salt = 5; }
    else if (salt.startsWith('High')) { score += 3; bd.salt = 3; }
    else if (salt.startsWith('Moderate')) { score += 1; bd.salt = 1; }

    const kidney = this.ans('kidney_disease'); if (kidney === 'Yes') { score += 4; bd.kidney = 4; }
    const preec = this.ans('preeclampsia'); if (preec === 'Yes') { score += 4; bd.preeclampsia = 4; }

    const sleep = String(this.ans('sleep_apnea') || '');
    if (sleep.includes('stop breathing') || sleep.includes('gasp')) { score += 3; bd.sleep_apnea = 3; }
    else if (sleep.includes('snore')) { score += 1; bd.sleep_apnea = 1; }

    const stress = this.ans('stress_level');
    if (stress === 'Severe — constant unmanageable stress') { score += 2; bd.stress = 2; }
    else if (stress === 'High — frequently overwhelmed') { score += 1; bd.stress = 1; }

    // Extra signals
    const headache = this.ans('morning_headaches');
    if (headache === 'Almost every morning') { score += 2; bd.morning_headaches = 2; }
    else if (headache === 'Often (several times a week)') { score += 1; bd.morning_headaches = 1; }

    const cholesterol = this.ans('cholesterol_history');
    if (cholesterol === 'Yes — but I am not on treatment') { score += 2; bd.cholesterol = 2; }
    else if (cholesterol === 'Yes — and I am managing it') { score += 1; bd.cholesterol = 1; }

    const alcohol = this.ans('alcohol');
    if (alcohol === 'Daily') { score += 2; bd.alcohol = 2; }
    else if (alcohol === '3-4 times per week') { score += 1; bd.alcohol = 1; }

    const smoking = this.ans('smoking');
    if (smoking === 'Yes, daily') { score += 2; bd.smoking = 2; }
    else if (smoking === 'Yes, occasionally') { score += 1; bd.smoking = 1; }

    let level: DualRiskAssessment['hypertensionRisk']['level'];
    let percentage: string;
    if (autoOverride === 'ON_MEDS' || autoOverride === 'STOPPED_MEDS') {
      level = 'very-high'; percentage = 'Already diagnosed — requires active management';
    } else {
      let adj = score + (age >= 55 ? 3 : 0);
      if (age < 35 && score < 12) adj -= 2;
      if (adj >= 28) { level = 'very-high'; percentage = '>50% — possible undiagnosed hypertension'; }
      else if (adj >= 21) { level = 'high'; percentage = '35-50%'; }
      else if (adj >= 15) { level = 'moderate'; percentage = '20-35%'; }
      else if (adj >= 9) { level = 'slightly-elevated'; percentage = '10-20%'; }
      else { level = 'low'; percentage = '<10%'; }
    }

    return { score, level, percentage, autoOverride, pointsBreakdown: bd };
  }

  private assembleAssessment(
    d: ReturnType<typeof this.calcDiabetesRisk>,
    h: ReturnType<typeof this.calcHypertensionRisk>,
  ): DualRiskAssessment {
    const findings: string[] = [];
    const recs: string[] = [];
    const urgent: string[] = [];
    const age = Number(this.ans('age')) || 0;
    const bmi = this.calcBMI();
    const activity = this.ans('physical_activity');
    const fDiab = this.ans('family_history_diabetes');
    const fHtn = this.ans('family_history_hypertension');
    const bpHx = this.ans('blood_pressure_history');
    const prevG = this.ans('previous_high_glucose');
    const waist = String(this.ans('waist_circumference') || '');

    if (age >= 55) findings.push('Age above 55 is an independent risk factor — both conditions accelerate in this range.');
    if (bmi >= 30) findings.push('Obesity significantly raises risk for both conditions through insulin resistance and vascular strain.');
    else if (bmi >= 25) findings.push('Being overweight meaningfully contributes to metabolic disease risk.');
    if (activity === 'No' || activity === false) findings.push('Physical inactivity is highly modifiable — even 30 minutes of daily walking reduces risk significantly.');
    if (fDiab && fDiab !== 'No') findings.push('Family history of diabetes increases your genetic predisposition — lifestyle choices matter even more for you.');
    if (fHtn && fHtn !== 'No' && fHtn !== "Don't know") findings.push('Family history of hypertension raises baseline cardiovascular risk.');
    if (bpHx === 'Yes — currently taking BP medication') findings.push('You are managing diagnosed hypertension — consistent medication adherence prevents serious complications.');
    else if (bpHx === 'Yes — was on medication but stopped') findings.push('Stopping blood pressure medication without guidance significantly increases stroke and heart attack risk.');
    else if (bpHx && bpHx !== 'No, never' && bpHx !== "Don't know / Not sure") findings.push('A previous high blood pressure reading warrants repeat monitoring.');
    if (prevG && prevG !== 'No, never') findings.push('Previous elevated blood glucose is a strong warning sign that diabetes may be developing.');
    if (waist === 'Very large waist' || waist === 'Large waist') findings.push('Central abdominal fat drives insulin resistance and arterial stiffness — more harmful than fat elsewhere.');

    if (d.level === 'very-high' || h.level === 'very-high') urgent.push('Schedule a comprehensive metabolic screening within the next 2-4 weeks.');
    else if (d.level === 'high' || h.level === 'high') urgent.push('Book a health screening appointment within the next 1-3 months.');
    if (bpHx === 'Yes — was on medication but stopped') urgent.push('Contact your doctor about restarting blood pressure medication as soon as possible.');

    const isElevated = d.level !== 'low' || h.level !== 'low';
    if (isElevated) {
      recs.push('Aim for 30 minutes of brisk walking, cycling, or swimming on most days.');
      recs.push('Reduce added sugars, heavily processed foods, and table salt in your diet.');
      recs.push('Eat more vegetables, legumes, whole grains, and fruits every day.');
      recs.push('If overweight, losing even 5-10% of your body weight significantly lowers risk for both conditions.');
      recs.push('Manage stress through rest, time outdoors, prayer, or social connection.');
      recs.push('Prioritise 7-8 hours of sleep — poor sleep directly worsens blood sugar and blood pressure.');
      recs.push('Get your blood pressure and fasting glucose checked by a healthcare provider.');
    } else {
      recs.push('Maintain your healthy habits — they are genuinely protecting your metabolic health.');
      recs.push('Stay physically active and keep your diet rich in plant foods.');
      recs.push('Have blood pressure and blood sugar checked at least once a year.');
    }
    recs.push('Visit a healthcare provider for a full metabolic check-up annually.');

    const dHigh = d.level === 'high' || d.level === 'very-high';
    const hHigh = h.level === 'high' || h.level === 'very-high';
    let summary: string;
    if (dHigh && hHigh) summary = '⚠️ Your risk is elevated for BOTH diabetes and hypertension. These two conditions are deeply connected — and the same lifestyle changes protect you from both simultaneously.';
    else if (dHigh) summary = 'Your diabetes risk is elevated and warrants clinical screening. Your hypertension risk is currently lower, but both conditions often develop together — monitoring both is wise.';
    else if (hHigh) summary = 'Your hypertension risk is elevated and deserves medical attention. Your diabetes risk is currently lower, though both conditions can co-develop — stay vigilant.';
    else if (d.level === 'low' && h.level === 'low') summary = '🟢 Great news — your current risk for both diabetes and hypertension appears low. You are doing many things right. Keep it up and schedule your annual check-up.';
    else summary = 'Your risk is in the moderate range for one or both conditions. Targeted lifestyle changes now can significantly reduce your long-term risk.';

    return {
      diabetesRisk: { level: d.level, score: d.score, percentage: d.percentage, pointsBreakdown: d.pointsBreakdown },
      hypertensionRisk: { level: h.level, score: h.score, percentage: h.percentage, pointsBreakdown: h.pointsBreakdown },
      summary, keyFindings: findings, recommendations: recs,
      urgentActions: urgent.length ? urgent : undefined,
      profile: this.profile ?? this.buildProfile(),
    };
  }

  private async aiEnhanceAssessment(assessment: DualRiskAssessment): Promise<DualRiskAssessment> {
    const age = Number(this.ans('age')) || 0;
    const gender = String(this.ans('gender') || '');
    const bmi = this.calcBMI();
    const allAnswers = this.answers.map(a => `• ${a.question}: "${a.value}"`).join('\n');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate clinical AI for metabolic disease prevention. Write in clear, warm, evidence-based English. Use universal food language: say "starchy staples", "cooked leafy greens", "green bananas", "beans and lentils" — avoid region-specific food names that may not be understood globally.',
          },
          {
            role: 'user',
            content: `You are a clinical AI for diabetes and hypertension prevention.

Patient: Age ${age} | Gender: ${gender} | BMI: ${bmi.toFixed(1)}
Diabetes risk: ${assessment.diabetesRisk.level} (score ${assessment.diabetesRisk.score})
Hypertension risk: ${assessment.hypertensionRisk.level} (score ${assessment.hypertensionRisk.score})

All patient answers:
${allAnswers}

Key findings:
${assessment.keyFindings.join('\n')}

Write a detailed, empathetic 4-paragraph clinical analysis (max 480 words):
1. Overall dual risk profile and how both conditions are connected for this person
2. Their specific diabetes risk factors and what they mean clinically
3. Their specific hypertension risk factors and cardiovascular implications
4. Practical, culturally grounded prevention strategies using universally understood foods: beans, lentils, green bananas, sweet potatoes, cassava, cooked leafy greens, whole grains, groundnuts. Also mention walking, community health centres, and accessible screening.

Tone: warm, evidence-based, hopeful. Not alarmist. Written for a non-medical reader.`,
          },
        ],
        temperature: 0.72,
        max_tokens: 1400,
      }),
    });

    if (!res.ok) throw new Error('AI enhance failed');
    const data = await res.json();
    return { ...assessment, detailedAnalysis: data.choices[0].message.content.trim() };
  }

  // ─── GENERATE RECOMMENDATIONS ─────────────────────────────────────────────

  async generateRecommendations(assessment: DualRiskAssessment): Promise<any> {
    if (!this.API_KEY) {
      console.log('⚠️ No Groq API key — using fallback recommendations');
      return this.getFallbackRecommendations(assessment);
    }

    try {
      const age = Number(this.ans('age')) || 0;
      const gender = String(this.ans('gender') || '');
      const bmi = this.calcBMI();
      const waist = String(this.ans('waist_circumference') || '');
      const allAnswers = this.answers.map(a => `• ${a.question}: "${a.value}"`).join('\n');

      const prompt = `You are a clinical AI specialised in diabetes and hypertension prevention.

PATIENT ASSESSMENT RESULTS:
- Age: ${age} years
- Gender: ${gender}
- BMI: ${bmi.toFixed(1)} (${this.getBMICategory(bmi)})
- Waist: ${waist}
- Diabetes risk level: ${assessment.diabetesRisk.level} (score: ${assessment.diabetesRisk.score}, ${assessment.diabetesRisk.percentage})
- Hypertension risk level: ${assessment.hypertensionRisk.level} (score: ${assessment.hypertensionRisk.score}, ${assessment.hypertensionRisk.percentage})
- Summary: ${assessment.summary}

PATIENT ANSWERS:
${allAnswers || '(baseline data only)'}

IMPORTANT LANGUAGE RULES:
- Use UNIVERSAL food names only. Do NOT use region-specific terms.
- ✅ Say: "green bananas", "starchy staples", "cooked leafy greens", "fermented milk", "whole grain porridge", "beans and lentils", "sweet potatoes", "cassava", "groundnuts", "sorghum", "millet"
- ❌ Do NOT say: matoke, ugali, posho, sukuma wiki, uji (without explanation), githeri, nsima, fufu by name

Generate exactly 12 highly personalised, evidence-based health recommendations for this specific patient.
Distribute across these 6 categories (2 per category):
1. nutrition
2. physical_activity
3. stress_sleep
4. medical
5. lifestyle
6. monitoring

Rules:
- Be HIGHLY SPECIFIC to their risk levels, BMI, waist, age, and actual answers
- Reference universal foods where relevant
- Be warm, practical, and achievable — not clinical jargon
- For urgent/high priority items, be direct about urgency
- Each action must be a concrete, single sentence the patient can act on this week
- Set locallyRelevant: true when you mention accessible foods, community health facilities, or walking culture
- Set evidenceBased: true for all clinically validated recommendations
- Use appropriate emoji icons (🚶, 🥗, 💧, 🧂, 😴, 🧘, 🏥, 🩸, ⚖️, etc.)
- Vary priority accurately: urgent items are genuinely urgent, medium items are for ongoing maintenance

Respond ONLY with a valid JSON array. No markdown. No explanation. Format:
[
  {
    "title": "Short title (3-5 words)",
    "description": "1-2 sentences explaining why this matters for them specifically.",
    "action": "Specific single sentence of what to do this week.",
    "frequency": "Daily",
    "category": "nutrition",
    "priority": "high",
    "icon": "🥗",
    "evidenceBased": true,
    "locallyRelevant": true
  }
]`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You output ONLY valid JSON arrays. No other text, no markdown, no backticks. Use universal food language only — no region-specific food names.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3200,
        }),
      });

      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const data = await res.json();
      const raw: string = data.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/gi, '').trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON array found in response');

      const parsed = JSON.parse(match[0]);
      console.log(`✅ Generated ${parsed.length} recommendations`);
      return parsed;
    } catch (e) {
      console.error('[GroqService] generateRecommendations error:', e);
      return this.getFallbackRecommendations(assessment);
    }
  }

  // ─── HELPER METHODS ───────────────────────────────────────────────────────

  private getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    if (bmi < 35) return 'obese';
    return 'severely obese';
  }

  private getFallbackRecommendations(assessment: DualRiskAssessment): any[] {
    const dHigh = assessment.diabetesRisk.level === 'high' || assessment.diabetesRisk.level === 'very-high';
    const hHigh = assessment.hypertensionRisk.level === 'high' || assessment.hypertensionRisk.level === 'very-high';

    return [
      {
        title: 'Daily 30-Min Walk',
        description: 'Regular walking is one of the most powerful tools to lower both blood sugar and blood pressure. Even a brisk 30-minute walk each day produces measurable improvements within weeks.',
        action: 'Walk briskly for 30 minutes every morning before breakfast, 5 days this week.',
        frequency: 'Daily',
        category: 'physical_activity',
        priority: dHigh || hHigh ? 'urgent' : 'high',
        icon: '🚶',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Reduce Starchy Portions',
        description: 'High-glycaemic starchy staples (cooked grains, cassava, green bananas) raise blood sugar rapidly when eaten in large amounts. Replacing half your portion with beans or vegetables significantly reduces metabolic load.',
        action: 'Replace half your starchy staple serving with beans, lentils, or steamed vegetables at lunch and dinner.',
        frequency: 'Every meal',
        category: 'nutrition',
        priority: dHigh ? 'urgent' : 'high',
        icon: '🍛',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Cut Sugary Drinks',
        description: 'Sodas, sweetened teas, and energy drinks contribute directly to insulin resistance and weight gain. Replacing them with water or unsweetened tea has immediate metabolic benefits.',
        action: 'Replace all sodas and sweetened drinks with water, plain tea, or lemon water this week.',
        frequency: 'Daily',
        category: 'nutrition',
        priority: 'high',
        icon: '💧',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Reduce Salt Intake',
        description: 'Excess salt is the leading dietary driver of hypertension. Most diets are high in salt through processed snacks and table salt added to food.',
        action: 'Remove the salt shaker from the table and avoid adding extra salt to cooked food.',
        frequency: 'Daily',
        category: 'nutrition',
        priority: hHigh ? 'urgent' : 'high',
        icon: '🧂',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Check Blood Pressure',
        description: 'Getting a professional blood pressure reading at your nearest health centre takes less than 5 minutes and gives you a critical baseline number to track.',
        action: 'Visit your nearest health centre or pharmacy to get a blood pressure reading this week.',
        frequency: 'Once (then monthly)',
        category: 'medical',
        priority: hHigh ? 'urgent' : 'high',
        icon: '🏥',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Fasting Blood Sugar Test',
        description: 'A simple fasting glucose test can confirm or rule out diabetes or prediabetes. Early detection is the most powerful tool available for preventing complications.',
        action: 'Ask your doctor for a fasting blood glucose test at your next visit.',
        frequency: 'Once (then annually)',
        category: 'medical',
        priority: dHigh ? 'urgent' : 'medium',
        icon: '🩸',
        evidenceBased: true,
        locallyRelevant: false,
      },
      {
        title: '7-8 Hours of Sleep',
        description: 'Poor sleep directly raises cortisol, blood sugar, and blood pressure. Improving sleep quality is one of the most underestimated metabolic interventions.',
        action: 'Set a consistent bedtime and wake time, aiming for 7-8 hours with no screens in the last 30 minutes.',
        frequency: 'Nightly',
        category: 'stress_sleep',
        priority: 'medium',
        icon: '😴',
        evidenceBased: true,
        locallyRelevant: false,
      },
      {
        title: 'Daily Stress Reduction',
        description: 'Chronic stress elevates cortisol, which raises blood sugar and constricts blood vessels. Even 10 minutes of calm daily reduces this burden measurably.',
        action: 'Spend 10 minutes each evening in quiet rest, prayer, or slow deep breathing before bed.',
        frequency: 'Daily',
        category: 'stress_sleep',
        priority: 'medium',
        icon: '🧘',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Eat More Leafy Greens',
        description: 'Cooked leafy greens are rich in magnesium, potassium, and fibre — all protective against both diabetes and hypertension. They are among the most affordable and accessible protective foods available.',
        action: 'Add a serving of cooked leafy greens (spinach, amaranth, or similar) to at least one meal daily.',
        frequency: 'Daily',
        category: 'nutrition',
        priority: 'medium',
        icon: '🥬',
        evidenceBased: true,
        locallyRelevant: true,
      },
      {
        title: 'Monthly Weight Tracking',
        description: 'Tracking your weight monthly helps you catch upward trends early. Even a 5-10% weight loss significantly reduces risk for both conditions.',
        action: 'Weigh yourself on the same scale every first Monday of the month and record the result.',
        frequency: 'Monthly',
        category: 'monitoring',
        priority: 'medium',
        icon: '⚖️',
        evidenceBased: true,
        locallyRelevant: false,
      },
      {
        title: 'Limit Alcohol',
        description: 'Alcohol raises blood pressure and adds empty calories that worsen insulin resistance. Even moderate reduction has measurable cardiovascular benefits.',
        action: 'Limit alcohol to no more than 1-2 drinks per week, or eliminate entirely if your risk is elevated.',
        frequency: 'Weekly',
        category: 'lifestyle',
        priority: 'medium',
        icon: '🚫',
        evidenceBased: true,
        locallyRelevant: false,
      },
      {
        title: 'Annual Health Check-Up',
        description: 'A full metabolic panel including blood glucose, blood pressure, cholesterol, and kidney function gives your doctor the complete picture needed to guide your care effectively.',
        action: 'Schedule a comprehensive metabolic health check-up at your nearest hospital or health centre.',
        frequency: 'Annually',
        category: 'monitoring',
        priority: 'low',
        icon: '📋',
        evidenceBased: true,
        locallyRelevant: true,
      },
    ];
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private ans(id: string): any { return this.answers.find(a => a.questionId === id)?.value; }
  getAnswers(): Answer[] { return this.answers; }
  getQuestionCount(): number { return this.questionCount; }
  getMaxQuestions(): number { return this.MAX_Q; }
  getUserProfile(): UserProfile | null { return this.profile; }

  reset(): void {
    this.answers = [];
    this.questionCount = 0;
    this.usedIds.clear();
    this.profile = null;
    // Re-shuffle fallback for the next session
    this.shuffledFallback = shuffleArray(FALLBACK_BANK);
  }
}

export const groqService = new GroqService();