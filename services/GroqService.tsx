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
    points?: {
      diabetes: number;
      hypertension: number;
    };
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
    waistCategory: 'normal' | 'elevated' | 'high';
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
  
  // BASELINE QUESTIONS - 4 questions as per rubric
  const BASELINE_QUESTIONS: Question[] = [
    {
      id: 'age',
      question: "How old are you?",
      type: 'slider',
      min: 18,
      max: 100,
      unit: 'years',
      required: true,
      aiGenerated: false,
      tooltip: "Risk for both diabetes and high blood pressure increases with age, especially after 45.",
      points: {
        diabetes: 0, // Calculated dynamically
        hypertension: 0
      }
    },
    {
      id: 'gender',
      question: "What is your biological sex?",
      type: 'multiple',
      options: ['Male', 'Female'],
      required: true,
      aiGenerated: false,
      tooltip: "Men tend to develop high blood pressure earlier, while women's risk increases after menopause. Some diabetes risk factors are unique to women.",
      points: {
        diabetes: 0,
        hypertension: 0
      }
    },
    {
      id: 'height_weight',
      question: "What is your height and weight?",
      type: 'text', // Will be handled as dual input in UI
      required: true,
      aiGenerated: false,
      tooltip: "We'll calculate your Body Mass Index (BMI). Excess weight significantly increases risk for both diabetes and high blood pressure.",
      points: {
        diabetes: 0, // Calculated dynamically
        hypertension: 0
      }
    },
    {
      id: 'waist_circumference',
      question: "Which image best matches your body shape?",
      type: 'multiple',
      options: ['Slim waist', 'Moderate waist', 'Large waist'],
      required: true,
      aiGenerated: false,
      tooltip: "Belly fat (central obesity) is particularly dangerous for both diabetes and high blood pressure. It's more harmful than fat in other areas.",
      points: {
        diabetes: 0, // Calculated dynamically
        hypertension: 0
      }
    },
  ];
  
 // COMPREHENSIVE QUESTION BANK - All questions from rubric
 const QUESTION_BANK: {
    shared: Record<string, Question>;
    diabetes: Record<string, Question>;
    hypertension: Record<string, Question>;
  } = {
    // Shared Risk Factors (Category A)
    shared: {
      physical_activity: {
        id: 'physical_activity',
        question: "Do you do at least 30 minutes of physical activity most days of the week?",
        type: 'yesno' as const,
        required: true,
        aiGenerated: false,
        points: {
          diabetes: 2, // No = +2
          hypertension: 3  // No = +3
        }
      },
      sedentary_time: {
        id: 'sedentary_time',
        question: "On a typical day, how many hours do you spend sitting?",
        type: 'multiple',
        options: ['Less than 3 hours', '3-6 hours', '6-9 hours', 'More than 9 hours'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const activity = answers.find(a => a.questionId === 'physical_activity')?.value;
          return activity === false || activity === 'No';
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 0
        }
      },
      vegetables_fruits: {
        id: 'vegetables_fruits',
        question: "Do you eat vegetables, fruits, or berries every day?",
        type: 'yesno',
        required: true,
        aiGenerated: false,
        points: {
          diabetes: 1, // No = +1
          hypertension: 2  // No = +2
        }
      },
      family_history_diabetes: {
        id: 'family_history_diabetes',
        question: "Has anyone in your family been diagnosed with diabetes?",
        type: 'multiple',
        options: ['No', 'Yes - grandparent, aunt, uncle, or cousin', 'Yes - parent, brother, sister, or child', 'Yes - multiple close relatives'],
        required: true,
        aiGenerated: false,
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 1  // Any diabetes = +1
        }
      },
      family_history_hypertension: {
        id: 'family_history_hypertension',
        question: "Has anyone in your family been diagnosed with high blood pressure (hypertension)?",
        type: 'multiple',
        options: ['No', 'Yes - grandparent, aunt, uncle, or cousin', 'Yes - parent, brother, sister, or child', 'Yes - multiple close relatives', "Don't know"],
        required: true,
        aiGenerated: false,
        points: {
          diabetes: 1, // Any hypertension = +1
          hypertension: 0  // Calculated from options
        }
      },
      smoking: {
        id: 'smoking',
        question: "Do you currently smoke cigarettes or use tobacco products?",
        type: 'multiple',
        options: ['No, never smoked', 'No, quit smoking (>5 years ago)', 'No, quit smoking (1-5 years ago)', 'No, quit smoking (<1 year ago)', 'Yes, occasionally', 'Yes, regularly (daily)'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return age >= 35;
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 0
        }
      },
      alcohol: {
        id: 'alcohol',
        question: "How often do you drink alcohol?",
        type: 'multiple',
        options: ['Never / Rarely', '1-2 times per month', '1-2 times per week', '3-4 times per week', '5-6 times per week', 'Daily'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return age >= 18; // Only ask adults
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 0
        }
      },
      sleep_duration: {
        id: 'sleep_duration',
        question: "How many hours of sleep do you typically get per night?",
        type: 'multiple',
        options: ['Less than 5 hours', '5-6 hours', '7-8 hours (optimal)', 'More than 9 hours'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          // Ask if stress mentioned, obese, or shift work
          const bmi = calculateBMIFromAnswers(answers);
          return bmi >= 25;
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 0
        }
      },
      stress_level: {
        id: 'stress_level',
        question: "How would you describe your stress level most days?",
        type: 'multiple',
        options: ['Low - calm most of the time', 'Moderate - some stress but manageable', 'High - frequently stressed or overwhelmed', 'Severe - constant, unmanageable stress'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          // Ask if high-risk occupation or multiple risk factors
          return true; // Intelligent condition based on profile
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 0
        }
      },
      occupation: {
        id: 'occupation',
        question: "Which best describes your typical work day?",
        type: 'multiple',
        options: ['Mostly sitting (desk work, driving)', 'Mix of sitting and moving', 'Mostly standing or moving', 'Heavy physical labor', 'Not currently working'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return age >= 18 && age <= 64;
        },
        points: {
          diabetes: 2, // Mostly sitting = +2
          hypertension: 2  // Mostly sitting = +2
        }
      }
    },
  
    // Diabetes-specific (Category B)
    diabetes: {
      previous_high_glucose: {
        id: 'previous_high_glucose',
        question: "Have you ever been found to have high blood sugar? This includes during a medical exam, when you were sick, or during pregnancy.",
        type: 'multiple',
        options: ['No, never', 'Yes, once during illness or stress', 'Yes, diagnosed with prediabetes', 'Yes, during pregnancy (gestational diabetes)', 'Yes, multiple times but not diagnosed'],
        required: true,
        aiGenerated: false,
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 1  // Any "Yes" = +1
        }
      },
      when_last_glucose_tested: {
        id: 'when_last_glucose_tested',
        question: "When was your last blood sugar or HbA1c test?",
        type:'multiple' as const,
        options: ['Within the past 6 months', '6 months to 1 year ago', '1-2 years ago', 'More than 2 years ago', 'Never been tested'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
            const glucose = answers.find(a => a.questionId === 'previous_high_glucose')?.value;
            if (!glucose || glucose === 'No, never') return false;
            return true;
          }
      },
      sugary_drinks: {
        id: 'sugary_drinks',
        question: "How often do you drink soda, sweetened juice, energy drinks, or other sugary beverages?",
        type: 'multiple',
        options: ['Rarely or never', '1-3 times per week', '4-6 times per week', 'Once daily', 'Multiple times per day'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const bmi = calculateBMIFromAnswers(answers);
          return bmi >= 25;
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 1  // Daily or more = +1
        }
      },
      gestational_diabetes: {
        id: 'gestational_diabetes',
        question: "Have you ever been pregnant?",
        type: 'yesno',
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const gender = answers.find(a => a.questionId === 'gender')?.value;
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return gender === 'Female' && age >= 18 && age <= 45;
        }
      },
      gestational_diabetes_detail: {
        id: 'gestational_diabetes_detail',
        question: "Were you diagnosed with gestational diabetes (high blood sugar during pregnancy)?",
        type: 'yesno',
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const pregnant = answers.find(a => a.questionId === 'gestational_diabetes')?.value;
          return pregnant === true || pregnant === 'Yes';
        },
        points: {
          diabetes: 5, // Yes = +5 (AUTO HIGH RISK)
          hypertension: 1  // Yes = +1
        }
      },
      pcos: {
        id: 'pcos',
        question: "Have you been diagnosed with Polycystic Ovary Syndrome (PCOS)?",
        type: 'multiple',
        options: ['Yes', 'No', 'Not sure'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const gender = answers.find(a => a.questionId === 'gender')?.value;
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          const bmi = calculateBMIFromAnswers(answers);
          return gender === 'Female' && age >= 18 && age <= 45 && bmi >= 25;
        },
        points: {
          diabetes: 3, // Yes = +3
          hypertension: 1  // Yes = +1
        }
      },
      processed_foods: {
        id: 'processed_foods',
        question: "How many times per week do you eat fried or heavily processed foods?",
        type: 'multiple',
        options: ['Rarely (less than once per week)', '1-2 times per week', '3-4 times per week', '5+ times per week', 'Daily'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const bmi = calculateBMIFromAnswers(answers);
          return bmi >= 25;
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 1  // 3+/week = +1
        }
      }
    },
  
    // Hypertension-specific (Category C)
    hypertension: {
      blood_pressure_history: {
        id: 'blood_pressure_history',
        question: "Have you ever been told by a healthcare provider that you have high blood pressure, or have you taken medication for blood pressure?",
        type: 'multiple',
        options: ['No, never', 'Yes, told I have high BP but not on medication', 'Yes, currently taking BP medication', 'Yes, was on medication but stopped', "Don't know / Not sure"],
        required: true,
        aiGenerated: false,
        points: {
          diabetes: 2, // Any "Yes" = +2
          hypertension: 0  // Calculated from options
        }
      },
      when_last_bp_checked: {
        id: 'when_last_bp_checked',
        question: "When was your blood pressure last measured by a healthcare provider?",
        type: 'multiple',
        options: ['Within the past 6 months', '6 months to 1 year ago', '1-2 years ago', 'More than 2 years ago', 'Never / Can\'t remember'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
            const bpHistory = answers.find(a => a.questionId === 'blood_pressure_history')?.value;
            return !!(bpHistory && bpHistory !== 'No, never');
          }
      },
      salt_intake: {
        id: 'salt_intake',
        question: "How would you describe your salt intake?",
        type: 'multiple',
        options: ['Low - I rarely add salt and avoid salty foods', 'Moderate - I occasionally add salt or eat salty foods', 'High - I regularly add salt and/or eat salty foods frequently', 'Very high - I add salt to most meals and eat salty foods daily'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return age >= 40;
        },
        points: {
          diabetes: 0,
          hypertension: 0  // Calculated from options
        }
      },
      sleep_apnea: {
        id: 'sleep_apnea',
        question: "Do you snore loudly, or has anyone told you that you stop breathing or gasp for air during sleep?",
        type: 'multiple',
        options: ['No', 'Yes, I snore loudly', 'Yes, I\'ve been told I stop breathing or gasp', 'Not sure / Sleep alone'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const bmi = calculateBMIFromAnswers(answers);
          return bmi >= 30;
        },
        points: {
          diabetes: 0, // Calculated from options
          hypertension: 0  // Calculated from options
        }
      },
      kidney_disease: {
        id: 'kidney_disease',
        question: "Have you ever been told you have kidney disease or kidney problems?",
        type: 'multiple',
        options: ['Yes', 'No', 'Not sure'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return age >= 55;
        },
        points: {
          diabetes: 2, // Yes = +2
          hypertension: 4  // Yes = +4
        }
      },
      preeclampsia: {
        id: 'preeclampsia',
        question: "During any pregnancy, were you diagnosed with preeclampsia or pregnancy-induced high blood pressure?",
        type: 'multiple',
        options: ['Yes', 'No', 'Not sure', 'Never pregnant'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const gender = answers.find(a => a.questionId === 'gender')?.value;
          const age = Number(answers.find(a => a.questionId === 'age')?.value) || 0;
          return gender === 'Female' && age >= 18 && age <= 50;
        },
        points: {
          diabetes: 1, // Yes = +1
          hypertension: 4  // Yes = +4
        }
      },
      anxiety: {
        id: 'anxiety',
        question: "Do you frequently experience anxiety, worry, or feel 'on edge' most days?",
        type: 'multiple',
        options: ['Rarely or never', 'Sometimes', 'Often (several days per week)', 'Very often (most days)'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          // Intelligent: Ask if high stress indicated or high-pressure occupation
          return true;
        },
        points: {
          diabetes: 0, // Often/very often = +1
          hypertension: 0  // Calculated from options
        }
      },
      medications: {
        id: 'medications',
        question: "Do you regularly take any of the following medications? (Select all that apply)",
        type: 'multiple',
        options: ['Oral contraceptives (birth control pills)', 'NSAIDs/pain relievers (ibuprofen, etc.) regularly', 'Steroids (prednisone, etc.)', 'Decongestants frequently', 'Antidepressants', 'None of these'],
        required: false,
        aiGenerated: false,
        condition: (answers: Answer[]) => {
          const gender = answers.find(a => a.questionId === 'gender')?.value;
          return gender === 'Female';
        },
        points: {
          diabetes: 0, // Steroids = +2
          hypertension: 0  // Calculated from options
        }
      }
    }
  };
  
  // Helper function to calculate BMI from answers
  function calculateBMIFromAnswers(answers: Answer[]): number {
    const heightAnswer = answers.find(a => a.questionId === 'height_weight')?.value;
    const weightAnswer = answers.find(a => a.questionId === 'height_weight')?.value;
    
    if (typeof heightAnswer === 'string' && typeof weightAnswer === 'string') {
      try {
        const [height, weight] = heightAnswer.split('/').map(Number);
        if (height > 0 && weight > 0) {
          const heightM = height / 100;
          return weight / (heightM * heightM);
        }
      } catch {
        return 0;
      }
    }
    return 0;
  }
  
  class GroqService {
    private answers: Answer[] = [];
    private questionCount = 0;
    private usedQuestionIds: Set<string> = new Set();
    private readonly MAX_QUESTIONS = 15;
    private readonly MIN_QUESTIONS = 8;
    private readonly API_KEY: string;
    private readonly GROQ_MODEL = 'llama-3.3-70b-versatile';
    private userProfile: UserProfile | null = null;
    private aiGeneratedQuestions: number = 0;
    private tier1QuestionsAsked: number = 0;
    private tier2QuestionsAsked: number = 0;
  
    // Decision tree state
    private currentTree: 'young_healthy' | 'middle_aged_overweight' | 'older_adult' | 'women_reproductive' | 'family_history' | 'medical_red_flags' | null = null;
  
    constructor() {
      this.API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
      
      if (this.API_KEY) {
        console.log('✅ Groq AI enabled with', this.GROQ_MODEL);
      } else {
        console.warn('⚠️ Groq API key not found - AI features disabled');
      }
    }
  
    // Calculate BMI from height and weight
    private calculateBMI(): number {
      const heightWeight = String(this.getAnswer('height_weight') || '');
      try {
        const [height, weight] = heightWeight.split('/').map(Number);
        if (height > 0 && weight > 0) {
          const heightM = height / 100;
          return weight / (heightM * heightM);
        }
      } catch {
        return 0;
      }
      return 0;
    }
  
    // Determine waist category
    private determineWaistCategory(): 'normal' | 'elevated' | 'high' {
      const waist = String(this.getAnswer('waist_circumference') || '');
      const gender = String(this.getAnswer('gender') || '');
      
      if (waist === 'Slim waist') return 'normal';
      if (waist === 'Moderate waist') return 'elevated';
      if (waist === 'Large waist') {
        return gender === 'Male' ? 'high' : 'high';
      }
      return 'normal';
    }
  
    // Determine user profile
    private determineUserProfile(): UserProfile {
      const age = Number(this.getAnswer('age')) || 0;
      const gender = String(this.getAnswer('gender') || '').toLowerCase() as 'male' | 'female';
      const bmi = this.calculateBMI();
      const waistCategory = this.determineWaistCategory();
      
      // Age category
      let ageCategory: 'young-adult' | 'middle-aged' | 'older-adult';
      if (age < 35) ageCategory = 'young-adult';
      else if (age < 55) ageCategory = 'middle-aged';
      else ageCategory = 'older-adult';
      
      // BMI category
      let bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely-obese';
      if (bmi < 18.5) bmiCategory = 'underweight';
      else if (bmi < 25) bmiCategory = 'normal';
      else if (bmi < 30) bmiCategory = 'overweight';
      else if (bmi < 35) bmiCategory = 'obese';
      else bmiCategory = 'severely-obese';
      
      // Specific profiles
      const specificProfiles: UserProfile['specificProfiles'] = [];
      
      // Family history
      const familyDiabetes = this.getAnswer('family_history_diabetes');
      const familyHypertension = this.getAnswer('family_history_hypertension');
      if ((familyDiabetes && familyDiabetes !== 'No') || 
          (familyHypertension && familyHypertension !== 'No')) {
        specificProfiles.push('family-history');
      }
      
      // Overweight/Obese
      if (bmi >= 25) specificProfiles.push('overweight');
      
      // Previous red flags
      const previousGlucose = this.getAnswer('previous_high_glucose');
      const bpHistory = this.getAnswer('blood_pressure_history');
      if ((previousGlucose && previousGlucose !== 'No, never') ||
          (bpHistory && bpHistory !== 'No, never')) {
        specificProfiles.push('previous-red-flags');
      }
      
      // Women reproductive age
      if (gender === 'female' && age >= 18 && age <= 45) {
        specificProfiles.push('women-reproductive');
      }
      
      // Determine which decision tree to use
      this.determineDecisionTree(ageCategory, bmiCategory, specificProfiles);
      
      return {
        ageCategory,
        gender,
        bmiCategory,
        waistCategory,
        riskLevel: 'low', // Initial, will be updated
        specificProfiles
      };
    }
  
    // Determine decision tree based on profile
    private determineDecisionTree(
      ageCategory: UserProfile['ageCategory'],
      bmiCategory: UserProfile['bmiCategory'],
      specificProfiles: UserProfile['specificProfiles']
    ) {
      // TREE 1: Young Adult, Normal Weight
      if (ageCategory === 'young-adult' && bmiCategory === 'normal') {
        this.currentTree = 'young_healthy';
      }
      // TREE 2: Middle-Aged, Overweight/Obese
      else if (ageCategory === 'middle-aged' && (bmiCategory === 'overweight' || bmiCategory === 'obese' || bmiCategory === 'severely-obese')) {
        this.currentTree = 'middle_aged_overweight';
      }
      // TREE 3: Older Adult
      else if (ageCategory === 'older-adult') {
        this.currentTree = 'older_adult';
      }
      // TREE 4: Women Reproductive Age
      else if (specificProfiles.includes('women-reproductive')) {
        this.currentTree = 'women_reproductive';
      }
      // TREE 5: Strong Family History
      else if (specificProfiles.includes('family-history')) {
        this.currentTree = 'family_history';
      }
      // TREE 6: Previous Medical Red Flags
      else if (specificProfiles.includes('previous-red-flags')) {
        this.currentTree = 'medical_red_flags';
      }
      // Default: Young Healthy
      else {
        this.currentTree = 'young_healthy';
      }
      
      console.log(`🌳 Using decision tree: ${this.currentTree}`);
    }
  
    // Main method to get next question
    async getNextQuestion(): Promise<Question | null> {
      // Check if we've reached max questions
      if (this.questionCount >= this.MAX_QUESTIONS) {
        return null;
      }
  
      // Phase 1: Ask baseline questions (questions 1-4)
      if (this.questionCount < 4) {
        const question = this.getBaselineQuestion();
        return question;
      }
  
      // After baseline, determine user profile
      if (!this.userProfile && this.questionCount === 4) {
        this.userProfile = this.determineUserProfile();
        console.log('👤 User profile determined:', this.userProfile);
      }
  
      // Phase 2: Ask Tier 1 questions (CRITICAL - must ask)
      if (this.tier1QuestionsAsked < this.getTier1QuestionCount()) {
        const tier1Question = this.getTier1Question();
        if (tier1Question) {
          this.tier1QuestionsAsked++;
          return tier1Question;
        }
      }
  
      // Phase 3: Ask Tier 2 questions (HIGH PRIORITY)
      if (this.tier2QuestionsAsked < this.getTier2QuestionCount() && this.questionCount < 12) {
        const tier2Question = this.getTier2Question();
        if (tier2Question) {
          this.tier2QuestionsAsked++;
          return tier2Question;
        }
      }
  
      // Phase 4: Intelligent AI-generated questions (questions 9-15)
      if (this.questionCount >= 8 && this.questionCount < this.MAX_QUESTIONS) {
        try {
          const aiQuestion = await this.generateIntelligentQuestion();
          if (aiQuestion) {
            this.aiGeneratedQuestions++;
            console.log(`🤖 AI Question ${this.aiGeneratedQuestions}: ${aiQuestion.question}`);
            return aiQuestion;
          }
        } catch (error) {
          console.error('❌ AI question generation failed:', error);
        }
      }
  
      // If we have enough information, stop
      if (this.hasSufficientInformation()) {
        return null;
      }
  
      // Fallback: Get any remaining relevant question
      return this.getConditionalQuestion();
    }
  
    private getBaselineQuestion(): Question {
      const template = BASELINE_QUESTIONS[this.questionCount];
      this.usedQuestionIds.add(template.id);
      this.questionCount++;
  
      return {
        ...template,
        required: true,
        aiGenerated: false
      };
    }
  
    private getTier1QuestionCount(): number {
      // Number of Tier 1 questions based on decision tree
      switch (this.currentTree) {
        case 'young_healthy': return 5;
        case 'middle_aged_overweight': return 8;
        case 'older_adult': return 7;
        case 'women_reproductive': return 6;
        case 'family_history': return 6;
        case 'medical_red_flags': return 4;
        default: return 5;
      }
    }
  
    private getTier2QuestionCount(): number {
      // Number of Tier 2 questions based on decision tree
      switch (this.currentTree) {
        case 'young_healthy': return 2;
        case 'middle_aged_overweight': return 4;
        case 'older_adult': return 3;
        case 'women_reproductive': return 3;
        case 'family_history': return 3;
        case 'medical_red_flags': return 2;
        default: return 2;
      }
    }
  
    private getTier1Question(): Question | null {
      const tier1Questions = this.getTier1QuestionsForTree();
      
      for (const questionId of tier1Questions) {
        if (!this.usedQuestionIds.has(questionId)) {
          const question = this.getQuestionById(questionId);
          if (question && this.checkCondition(question)) {
            this.usedQuestionIds.add(questionId);
            this.questionCount++;
            return question;
          }
        }
      }
      
      return null;
    }
  
    private getTier2Question(): Question | null {
      const tier2Questions = this.getTier2QuestionsForTree();
      
      for (const questionId of tier2Questions) {
        if (!this.usedQuestionIds.has(questionId)) {
          const question = this.getQuestionById(questionId);
          if (question && this.checkCondition(question)) {
            this.usedQuestionIds.add(questionId);
            this.questionCount++;
            return question;
          }
        }
      }
      
      return null;
    }
  
    private getTier1QuestionsForTree(): string[] {
      // Based on decision trees from rubric
      switch (this.currentTree) {
        case 'young_healthy':
          return [
            'family_history_diabetes',
            'family_history_hypertension',
            'previous_high_glucose',
            'blood_pressure_history',
            'physical_activity',
            'vegetables_fruits'
          ];
        case 'middle_aged_overweight':
          return [
            'family_history_diabetes',
            'family_history_hypertension',
            'previous_high_glucose',
            'blood_pressure_history',
            'salt_intake',
            'physical_activity',
            'sugary_drinks',
            'vegetables_fruits'
          ];
        case 'older_adult':
          return [
            'previous_high_glucose',
            'blood_pressure_history',
            'family_history_diabetes',
            'family_history_hypertension',
            'salt_intake',
            'physical_activity',
            'vegetables_fruits'
          ];
        case 'women_reproductive':
          return [
            'gestational_diabetes',
            'family_history_diabetes',
            'family_history_hypertension',
            'previous_high_glucose',
            'blood_pressure_history',
            'physical_activity',
            'vegetables_fruits'
          ];
        case 'family_history':
          return [
            'previous_high_glucose',
            'blood_pressure_history',
            'physical_activity',
            'vegetables_fruits',
            'salt_intake',
            'sugary_drinks'
          ];
        case 'medical_red_flags':
          return [
            'previous_high_glucose',
            'blood_pressure_history',
            'physical_activity',
            'vegetables_fruits'
          ];
        default:
          return [
            'family_history_diabetes',
            'family_history_hypertension',
            'previous_high_glucose',
            'blood_pressure_history',
            'physical_activity',
            'vegetables_fruits'
          ];
      }
    }
  
    private getTier2QuestionsForTree(): string[] {
      switch (this.currentTree) {
        case 'young_healthy':
          return ['occupation', 'sedentary_time'];
        case 'middle_aged_overweight':
          return ['sedentary_time', 'sleep_apnea', 'occupation', 'processed_foods'];
        case 'older_adult':
          return ['occupation', 'sedentary_time', 'kidney_disease'];
        case 'women_reproductive':
          return ['sugary_drinks', 'occupation', 'pcos'];
        case 'family_history':
          return ['occupation', 'sedentary_time', 'sleep_duration'];
        case 'medical_red_flags':
          return ['occupation', 'sedentary_time'];
        default:
          return ['occupation', 'sedentary_time'];
      }
    }
  
    private getQuestionById(questionId: string): Question | null {
      // Search through all question banks
      const allQuestions = [
        ...Object.values(QUESTION_BANK.shared),
        ...Object.values(QUESTION_BANK.diabetes),
        ...Object.values(QUESTION_BANK.hypertension)
      ];
      
      const foundQuestion = allQuestions.find(q => q.id === questionId) || null;
      return foundQuestion as Question | null;
    }
  
    private checkCondition(question: Question): boolean {
      if (!question.condition) return true;
      return question.condition(this.answers);
    }
  
    private async generateIntelligentQuestion(): Promise<Question | null> {
      if (!this.API_KEY) {
        return this.getConditionalQuestion();
      }
  
      try {
        const prompt = this.buildAIQuestionPrompt();
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.GROQ_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are a medical AI specializing in diabetes and hypertension risk assessment.
                Generate ONE highly personalized follow-up question based on the user's profile and answers.
                The question should:
                1. Address the biggest information gap for this specific user
                2. Be personalized to their age, gender, BMI, and risk factors
                3. Help refine either diabetes OR hypertension risk estimation
                4. Be conversational and clear (under 15 words)
                5. NOT repeat questions already asked
                
                RESPONSE FORMAT - ONLY valid JSON:
                {
                  "question": "Your personalized question?",
                  "type": "multiple|yesno|slider|text",
                  "options": ["Option 1", "Option 2"] // ONLY for multiple type
                  "min": number, // ONLY for slider type
                  "max": number, // ONLY for slider type
                  "unit": "string" // ONLY for slider type
                }`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 300,
          })
        });
  
        if (!response.ok) {
          throw new Error(`Groq API error: ${response.status}`);
        }
  
        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();
        
        return this.parseAIQuestion(aiResponse);
      } catch (error) {
        console.error('AI question generation failed:', error);
        return this.getConditionalQuestion();
      }
    }
  
    private buildAIQuestionPrompt(): string {
      const age = Number(this.getAnswer('age')) || 0;
      const gender = String(this.getAnswer('gender') || '');
      const bmi = this.calculateBMI();
      const bmiCategory = bmi < 18.5 ? 'underweight' : 
                         bmi < 25 ? 'normal' : 
                         bmi < 30 ? 'overweight' : 'obese';
      
      const recentAnswers = this.answers.slice(-5).map(a => 
        `Q: ${a.question}\nA: ${a.value}`
      ).join('\n\n');
      
      const preliminaryRisk = this.calculatePreliminaryRisk();
      
      return `USER PROFILE:
  - Age: ${age} years
  - Gender: ${gender}
  - BMI: ${bmi.toFixed(1)} (${bmiCategory})
  - Decision Tree: ${this.currentTree}
  - Questions asked: ${this.questionCount}/15
  - AI questions generated: ${this.aiGeneratedQuestions}
  
  RECENT ANSWERS:
  ${recentAnswers}
  
  PRELIMINARY RISK ANALYSIS:
  Diabetes: ${preliminaryRisk.diabetesScore} points (${preliminaryRisk.diabetesLevel})
  Hypertension: ${preliminaryRisk.hypertensionScore} points (${preliminaryRisk.hypertensionLevel})
  Key concerns: ${preliminaryRisk.concerns.join(', ') || 'None'}
  
  ALREADY ASKED QUESTIONS:
  ${Array.from(this.usedQuestionIds).join(', ')}
  
  TASK: Generate ONE highly personalized question that:
  1. Addresses the biggest remaining information gap
  2. Is tailored to this specific user profile
  3. Helps refine risk assessment for diabetes OR hypertension
  4. Is NOT already covered by the questions above
  
  PRIORITY AREAS (choose most relevant):
  ${this.getPriorityAreasForAI()}
  
  Make it PERSONALIZED and UNIQUE to this user!`;
    }
  
    private getPriorityAreasForAI(): string {
      const age = Number(this.getAnswer('age')) || 0;
      const gender = String(this.getAnswer('gender') || '');
      const bmi = this.calculateBMI();
      
      const areas = [];
      
      // Age-based priorities
      if (age < 35) {
        areas.push('• Stress management and coping strategies');
        areas.push('• Sleep quality and patterns');
        areas.push('• Dietary habits in detail');
        areas.push('• Physical activity consistency');
      } else if (age < 55) {
        areas.push('• Work-life balance and stress');
        areas.push('• Sleep apnea symptoms');
        areas.push('• Family health history details');
        areas.push('• Previous screening history');
      } else {
        areas.push('• Medication adherence');
        areas.push('• Comorbid conditions');
        areas.push('• Mobility and physical function');
        areas.push('• Social support system');
      }
      
      // Gender-based priorities
      if (gender === 'Female') {
        areas.push('• Menstrual cycle regularity');
        areas.push('• Pregnancy history details');
        areas.push('• Hormonal health');
      }
      
      // BMI-based priorities
      if (bmi >= 30) {
        areas.push('• Weight management attempts');
        areas.push('• Emotional eating patterns');
        areas.push('• Joint or mobility issues');
      }
      
      return areas.join('\n');
    }
  
    private parseAIQuestion(aiResponse: string): Question {
      try {
        const cleaned = aiResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (!parsed.question || !parsed.type) {
          throw new Error('Missing required fields');
        }
        
        const aiId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const question: Question = {
          id: aiId,
          question: parsed.question,
          type: parsed.type,
          required: true,
          aiGenerated: true,
        };
        
        if (parsed.type === 'multiple' && parsed.options) {
          question.options = parsed.options;
        }
        
        if (parsed.type === 'slider') {
          if (typeof parsed.min === 'number') question.min = parsed.min;
          if (typeof parsed.max === 'number') question.max = parsed.max;
          if (parsed.unit) question.unit = parsed.unit;
        }
        
        if (parsed.type === 'yesno') {
          question.options = ['Yes', 'No'];
        }
        
        this.usedQuestionIds.add(aiId);
        this.questionCount++;
        
        return question;
      } catch (error) {
        console.error('Parse error:', error);
        throw new Error('Failed to parse AI response');
      }
    }
  
    private getConditionalQuestion(): Question | null {
      // Get any remaining question that meets conditions
      const allQuestions = [
        ...Object.values(QUESTION_BANK.shared),
        ...Object.values(QUESTION_BANK.diabetes),
        ...Object.values(QUESTION_BANK.hypertension)
      ];
      
      for (const question of allQuestions) {
        if (!this.usedQuestionIds.has(question.id) && 
            this.checkCondition(question) &&
            !question.required) { // Don't include required questions here
          this.usedQuestionIds.add(question.id);
          this.questionCount++;
          return question;
        }
      }
      
      return null;
    }
  
    private hasSufficientInformation(): boolean {
      // Check if we have critical information
      const hasCriticalInfo = 
        this.usedQuestionIds.has('previous_high_glucose') &&
        this.usedQuestionIds.has('blood_pressure_history') &&
        this.usedQuestionIds.has('family_history_diabetes') &&
        this.usedQuestionIds.has('family_history_hypertension');
      
      // Check if we have enough questions
      const hasEnoughQuestions = this.questionCount >= this.MIN_QUESTIONS;
      
      // Check if risk is already clear
      const preliminaryRisk = this.calculatePreliminaryRisk();
      const riskIsClear = 
        preliminaryRisk.diabetesLevel === 'very-high' || 
        preliminaryRisk.hypertensionLevel === 'very-high' ||
        (preliminaryRisk.diabetesLevel === 'low' && preliminaryRisk.hypertensionLevel === 'low');
      
      return (hasCriticalInfo && hasEnoughQuestions) || riskIsClear;
    }
  
    private calculatePreliminaryRisk() {
      // Simplified preliminary risk calculation
      let dScore = 0;
      let hScore = 0;
      const concerns: string[] = [];
      
      const age = Number(this.getAnswer('age')) || 0;
      const bmi = this.calculateBMI();
      const gender = String(this.getAnswer('gender') || '');
      
      // Age scoring
      if (age >= 55) {
        dScore += 6; hScore += 8;
        concerns.push('Age 55+');
      } else if (age >= 45) {
        dScore += 4; hScore += 5;
      } else if (age >= 35) {
        dScore += 2; hScore += 3;
      }
      
      // BMI scoring
      if (bmi >= 35) {
        dScore += 7; hScore += 8;
        concerns.push('Severe obesity');
      } else if (bmi >= 30) {
        dScore += 5; hScore += 5;
        concerns.push('Obesity');
      } else if (bmi >= 25) {
        dScore += 3; hScore += 3;
        concerns.push('Overweight');
      }
      
      // Gender for hypertension
      if (gender === 'Male') {
        hScore += 1;
      }
      
      let dLevel = 'low';
      if (dScore >= 18) dLevel = 'high';
      else if (dScore >= 13) dLevel = 'moderate';
      else if (dScore >= 8) dLevel = 'slightly elevated';
      
      let hLevel = 'low';
      if (hScore >= 21) hLevel = 'high';
      else if (hScore >= 15) hLevel = 'moderate';
      else if (hScore >= 9) hLevel = 'slightly elevated';
      
      return { diabetesScore: dScore, hypertensionScore: hScore, diabetesLevel: dLevel, hypertensionLevel: hLevel, concerns };
    }
  
    // Save answer with points calculation
    saveAnswer(question: Question, value: string | number | boolean) {
      this.answers.push({
        questionId: question.id,
        value,
        question: question.question,
      });
      
      // Update user profile if needed
      if (this.questionCount >= 4 && !this.userProfile) {
        this.userProfile = this.determineUserProfile();
      }
    }
  
    // Complete risk assessment
    async generateRiskAssessment(): Promise<DualRiskAssessment> {
      console.log('📊 Generating comprehensive risk assessment...');
      
      const diabetesRisk = this.calculateDiabetesRisk();
      const hypertensionRisk = this.calculateHypertensionRisk();
      
      const assessment = this.buildDualAssessment(diabetesRisk, hypertensionRisk);
      
      // Enhance with AI if available
      if (this.API_KEY && this.aiGeneratedQuestions > 0) {
        try {
          return await this.enhanceAssessmentWithAI(assessment);
        } catch (error) {
          console.error('AI enhancement failed:', error);
          return assessment;
        }
      }
      
      return assessment;
    }
  
    private calculateDiabetesRisk() {
      let score = 0;
      const breakdown: Record<string, number> = {};
      
      // Age points
      const age = Number(this.getAnswer('age')) || 0;
      if (age >= 64) { score += 6; breakdown.age = 6; }
      else if (age >= 55) { score += 5; breakdown.age = 5; }
      else if (age >= 45) { score += 4; breakdown.age = 4; }
      else if (age >= 35) { score += 2; breakdown.age = 2; }
      
      // BMI points
      const bmi = this.calculateBMI();
      if (bmi >= 35) { score += 7; breakdown.bmi = 7; }
      else if (bmi >= 30) { score += 5; breakdown.bmi = 5; }
      else if (bmi >= 25) { score += 3; breakdown.bmi = 3; }
      
      // Waist points
      const waist = this.determineWaistCategory();
      const gender = String(this.getAnswer('gender') || '');
      if (waist === 'high') { 
        score += 4; 
        breakdown.waist = 4; 
      } else if (waist === 'elevated') { 
        score += 3; 
        breakdown.waist = 3; 
      }
      
      // Physical activity
      const activity = this.getAnswer('physical_activity');
      if (activity === false || activity === 'No') {
        score += 2;
        breakdown.physical_activity = 2;
      }
      
      // Vegetables/fruits
      const veggies = this.getAnswer('vegetables_fruits');
      if (veggies === false || veggies === 'No') {
        score += 1;
        breakdown.vegetables_fruits = 1;
      }
      
      // Family history diabetes
      const familyDiabetes = this.getAnswer('family_history_diabetes');
      if (familyDiabetes === 'Yes - parent, brother, sister, or child' || 
          familyDiabetes === 'Yes - multiple close relatives') {
        score += 5;
        breakdown.family_history_diabetes = 5;
      } else if (familyDiabetes === 'Yes - grandparent, aunt, uncle, or cousin') {
        score += 3;
        breakdown.family_history_diabetes = 3;
      }
      
      // Previous high glucose
      const previousGlucose = this.getAnswer('previous_high_glucose');
      if (previousGlucose === 'Yes, diagnosed with prediabetes' || 
          previousGlucose === 'Yes, during pregnancy (gestational diabetes)') {
        score += 8;
        breakdown.previous_high_glucose = 8;
      } else if (previousGlucose === 'Yes, multiple times but not diagnosed') {
        score += 6;
        breakdown.previous_high_glucose = 6;
      } else if (previousGlucose === 'Yes, once during illness or stress') {
        score += 3;
        breakdown.previous_high_glucose = 3;
      }
      
      // Gestational diabetes (auto high risk)
      const gestational = this.getAnswer('gestational_diabetes_detail');
      let autoOverride: string | undefined;
      if (gestational === true || gestational === 'Yes') {
        autoOverride = 'GESTATIONAL_DIABETES';
      }
      
      // Determine level with overrides
      let level: 'low' | 'slightly-elevated' | 'moderate' | 'high' | 'very-high';
      let percentage: string;
      
      if (autoOverride === 'GESTATIONAL_DIABETES') {
        level = 'high';
        percentage = '25-40% (50% risk with gestational diabetes history)';
      } else {
        // Age adjustment
        let adjustedScore = score;
        if (age >= 55) adjustedScore += 2;
        
        if (adjustedScore >= 24) {
          level = 'very-high';
          percentage = '>40% or may already have diabetes';
        } else if (adjustedScore >= 18) {
          level = 'high';
          percentage = '20-40%';
        } else if (adjustedScore >= 13) {
          level = 'moderate';
          percentage = '10-20%';
        } else if (adjustedScore >= 8) {
          level = 'slightly-elevated';
          percentage = '5-10%';
        } else {
          level = 'low';
          percentage = '<5%';
        }
      }
      
      return { score, level, percentage, autoOverride, pointsBreakdown: breakdown };
    }
  
    private calculateHypertensionRisk() {
      let score = 0;
      const breakdown: Record<string, number> = {};
      
      // Age points (stronger for hypertension)
      const age = Number(this.getAnswer('age')) || 0;
      if (age >= 65) { score += 8; breakdown.age = 8; }
      else if (age >= 55) { score += 6; breakdown.age = 6; }
      else if (age >= 45) { score += 4; breakdown.age = 4; }
      else if (age >= 35) { score += 2; breakdown.age = 2; }
      
      // Gender points
      const gender = String(this.getAnswer('gender') || '');
      if (gender === 'Male') {
        score += 1;
        breakdown.gender = 1;
      } else if (gender === 'Female' && age > 55) {
        score += 2;
        breakdown.gender = 2;
      }
      
      // BMI points
      const bmi = this.calculateBMI();
      if (bmi >= 35) { score += 8; breakdown.bmi = 8; }
      else if (bmi >= 30) { score += 5; breakdown.bmi = 5; }
      else if (bmi >= 25) { score += 3; breakdown.bmi = 3; }
      
      // Waist points
      const waist = this.determineWaistCategory();
      if (waist === 'high') {
        score += 4;
        breakdown.waist = 4;
      }
      
      // Physical activity
      const activity = this.getAnswer('physical_activity');
      if (activity === false || activity === 'No') {
        score += 3;
        breakdown.physical_activity = 3;
      }
      
      // Vegetables/fruits
      const veggies = this.getAnswer('vegetables_fruits');
      if (veggies === false || veggies === 'No') {
        score += 2;
        breakdown.vegetables_fruits = 2;
      }
      
      // Family history hypertension
      const familyHypertension = this.getAnswer('family_history_hypertension');
      if (familyHypertension === 'Yes - parent, brother, sister, or child' || 
          familyHypertension === 'Yes - multiple close relatives') {
        score += 5;
        breakdown.family_history_hypertension = 5;
      } else if (familyHypertension === 'Yes - grandparent, aunt, uncle, or cousin') {
        score += 2;
        breakdown.family_history_hypertension = 2;
      }
      
      // Blood pressure history
      const bpHistory = this.getAnswer('blood_pressure_history');
      let autoOverride: string | undefined;
      if (bpHistory === 'Yes, currently taking BP medication') {
        autoOverride = 'ON_BP_MEDICATION';
        score += 6;
        breakdown.blood_pressure_history = 6;
      } else if (bpHistory === 'Yes, was on medication but stopped') {
        autoOverride = 'STOPPED_BP_MEDICATION';
        score += 7;
        breakdown.blood_pressure_history = 7;
      } else if (bpHistory === 'Yes, told I have high BP but not on medication') {
        score += 5;
        breakdown.blood_pressure_history = 5;
      }
      
      // Salt intake
      const salt = this.getAnswer('salt_intake');
      if (salt === 'Very high') {
        score += 5;
        breakdown.salt_intake = 5;
      } else if (salt === 'High') {
        score += 3;
        breakdown.salt_intake = 3;
      } else if (salt === 'Moderate') {
        score += 1;
        breakdown.salt_intake = 1;
      }
      
      // Determine level with overrides
      let level: 'low' | 'slightly-elevated' | 'moderate' | 'high' | 'very-high';
      let percentage: string;
      
      if (autoOverride === 'ON_BP_MEDICATION' || autoOverride === 'STOPPED_BP_MEDICATION') {
        level = 'very-high';
        percentage = 'Already diagnosed - requires ongoing monitoring';
      } else {
        // Age adjustment
        let adjustedScore = score;
        if (age >= 55) adjustedScore += 3;
        if (age < 35 && score < 15) adjustedScore -= 2;
        
        if (adjustedScore >= 28) {
          level = 'very-high';
          percentage = '>50% or likely already have hypertension';
        } else if (adjustedScore >= 21) {
          level = 'high';
          percentage = '35-50%';
        } else if (adjustedScore >= 15) {
          level = 'moderate';
          percentage = '20-35%';
        } else if (adjustedScore >= 9) {
          level = 'slightly-elevated';
          percentage = '10-20%';
        } else {
          level = 'low';
          percentage = '<10%';
        }
      }
      
      return { score, level, percentage, autoOverride, pointsBreakdown: breakdown };
    }
  
    private buildDualAssessment(
      diabetesRisk: ReturnType<typeof this.calculateDiabetesRisk>,
      hypertensionRisk: ReturnType<typeof this.calculateHypertensionRisk>
    ): DualRiskAssessment {
      const keyFindings: string[] = [];
      const recommendations: string[] = [];
      const urgentActions: string[] = [];
      
      // Generate integrated summary
      const summary = this.generateIntegratedSummary(diabetesRisk, hypertensionRisk);
      
      // Add findings based on answers
      this.addKeyFindings(keyFindings, diabetesRisk, hypertensionRisk);
      
      // Add recommendations
      this.addRecommendations(recommendations, urgentActions, diabetesRisk, hypertensionRisk);
      
      return {
        diabetesRisk: {
          level: diabetesRisk.level,
          score: diabetesRisk.score,
          percentage: diabetesRisk.percentage,
          pointsBreakdown: diabetesRisk.pointsBreakdown
        },
        hypertensionRisk: {
          level: hypertensionRisk.level,
          score: hypertensionRisk.score,
          percentage: hypertensionRisk.percentage,
          pointsBreakdown: hypertensionRisk.pointsBreakdown
        },
        summary,
        keyFindings,
        recommendations,
        urgentActions: urgentActions.length > 0 ? urgentActions : undefined,
        profile: this.userProfile!
      };
    }
  
    private generateIntegratedSummary(
      diabetesRisk: ReturnType<typeof this.calculateDiabetesRisk>,
      hypertensionRisk: ReturnType<typeof this.calculateHypertensionRisk>
    ): string {
      if (diabetesRisk.level === 'high' || diabetesRisk.level === 'very-high') {
        if (hypertensionRisk.level === 'high' || hypertensionRisk.level === 'very-high') {
          return '⚠️ You have elevated risk for BOTH diabetes and high blood pressure. These conditions often occur together and share many of the same causes. The good news: many of the same lifestyle changes help prevent BOTH conditions.';
        } else {
          return 'Your diabetes risk is elevated and requires screening, while your blood pressure risk is currently lower. However, because diabetes and high blood pressure often develop together, we recommend checking both.';
        }
      } else if (hypertensionRisk.level === 'high' || hypertensionRisk.level === 'very-high') {
        return 'Your blood pressure risk is elevated and requires screening, while your diabetes risk is currently lower. Both conditions can develop together, so monitoring both is recommended.';
      } else if (diabetesRisk.level === 'low' && hypertensionRisk.level === 'low') {
        return '🟢 Great news! Your current risk for both diabetes and high blood pressure is low. You\'re doing many things right to protect your metabolic health.';
      } else {
        return 'Your risk levels are in the moderate range. While not immediately urgent, lifestyle improvements can significantly reduce your risk.';
      }
    }
  
    private addKeyFindings(
      findings: string[],
      diabetesRisk: ReturnType<typeof this.calculateDiabetesRisk>,
      hypertensionRisk: ReturnType<typeof this.calculateHypertensionRisk>
    ) {
      const age = Number(this.getAnswer('age')) || 0;
      const bmi = this.calculateBMI();
      const activity = this.getAnswer('physical_activity');
      
      if (age >= 55) {
        findings.push('Age is a significant risk factor for both diabetes and hypertension');
      }
      
      if (bmi >= 30) {
        findings.push('Obesity significantly increases risk for both conditions');
      } else if (bmi >= 25) {
        findings.push('Overweight status contributes to metabolic disease risk');
      }
      
      if (activity === false || activity === 'No') {
        findings.push('Physical inactivity contributes to metabolic disease risk');
      }
      
      const familyDiabetes = this.getAnswer('family_history_diabetes');
      const familyHypertension = this.getAnswer('family_history_hypertension');
      
      if (familyDiabetes && familyDiabetes !== 'No') {
        findings.push('Family history of diabetes increases genetic predisposition');
      }
      
      if (familyHypertension && familyHypertension !== 'No') {
        findings.push('Family history of hypertension increases genetic predisposition');
      }
      
      // Auto-override findings
      if (diabetesRisk.autoOverride === 'GESTATIONAL_DIABETES') {
        findings.push('History of gestational diabetes: 50% risk of developing Type 2 diabetes');
      }
      
      if (hypertensionRisk.autoOverride === 'ON_BP_MEDICATION') {
        findings.push('Currently managing diagnosed hypertension with medication');
      }
    }
  
    private addRecommendations(
      recommendations: string[],
      urgentActions: string[],
      diabetesRisk: ReturnType<typeof this.calculateDiabetesRisk>,
      hypertensionRisk: ReturnType<typeof this.calculateHypertensionRisk>
    ) {
      // Urgent actions based on risk level
      if (diabetesRisk.level === 'very-high' || hypertensionRisk.level === 'very-high') {
        urgentActions.push('Schedule comprehensive screening within 2-4 weeks');
      } else if (diabetesRisk.level === 'high' || hypertensionRisk.level === 'high') {
        urgentActions.push('Schedule screening within 1-3 months');
      }
      
      // General recommendations
      if (diabetesRisk.level !== 'low' || hypertensionRisk.level !== 'low') {
        recommendations.push('Focus on weight management through balanced diet and regular exercise');
        recommendations.push('Reduce intake of processed foods, sugar, and salt');
        recommendations.push('Increase consumption of fruits, vegetables, and whole grains');
        recommendations.push('Aim for at least 150 minutes of moderate exercise weekly');
        recommendations.push('Manage stress through relaxation techniques');
        recommendations.push('Ensure 7-8 hours of quality sleep per night');
      } else {
        recommendations.push('Maintain your current healthy habits');
        recommendations.push('Continue regular physical activity');
        recommendations.push('Eat a balanced diet rich in fruits and vegetables');
      }
      
      recommendations.push('Schedule regular check-ups with your healthcare provider');
    }
  
    private async enhanceAssessmentWithAI(assessment: DualRiskAssessment): Promise<DualRiskAssessment> {
      const prompt = `You are a medical AI assistant specializing in diabetes and hypertension risk assessment for East African populations.
      
      USER PROFILE:
      Age: ${Number(this.getAnswer('age'))} years
      Gender: ${this.getAnswer('gender')}
      BMI: ${this.calculateBMI().toFixed(1)}
      Risk Categories: Diabetes - ${assessment.diabetesRisk.level}, Hypertension - ${assessment.hypertensionRisk.level}
      
      ASSESSMENT SUMMARY:
      ${assessment.summary}
      
      KEY FINDINGS:
      ${assessment.keyFindings.join('\n')}
      
      TASK: Write a detailed, empathetic 4-paragraph analysis (max 500 words):
      
      Paragraph 1: Overall risk profile and the connection between diabetes & hypertension
      Paragraph 2: Diabetes-specific risk factors and what they mean for this user
      Paragraph 3: Hypertension-specific risk factors and concerns
      Paragraph 4: Actionable, culturally appropriate prevention strategies
      
      Tone: Professional yet compassionate. Evidence-based. Culturally sensitive for Rwandan/East African context.
      Focus: Emphasize prevention potential through lifestyle changes.`;
      
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.GROQ_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a compassionate medical AI specializing in diabetes and hypertension prevention in East Africa. Provide evidence-based, culturally sensitive health guidance.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          })
        });
        
        if (!response.ok) throw new Error('AI enhancement failed');
        
        const data = await response.json();
        const aiAnalysis = data.choices[0].message.content.trim();
        
        return {
          ...assessment,
          detailedAnalysis: aiAnalysis
        };
      } catch (error) {
        console.error('AI enhancement failed:', error);
        return assessment;
      }
    }
  
    // Helper methods
    private getAnswer(questionId: string): any {
      return this.answers.find(a => a.questionId === questionId)?.value;
    }
  
    getAnswers(): Answer[] {
      return this.answers;
    }
  
    getProgress(): number {
      return Math.round((this.questionCount / this.MAX_QUESTIONS) * 100);
    }
  
    getQuestionCount(): number {
      return this.questionCount;
    }
  
    getMaxQuestions(): number {
      return this.MAX_QUESTIONS;
    }
  
    getUserProfile(): UserProfile | null {
      return this.userProfile;
    }
  
    reset() {
      this.answers = [];
      this.questionCount = 0;
      this.usedQuestionIds.clear();
      this.userProfile = null;
      this.aiGeneratedQuestions = 0;
      this.tier1QuestionsAsked = 0;
      this.tier2QuestionsAsked = 0;
      this.currentTree = null;
    }
  }
  
  export const groqService = new GroqService();