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
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
  question: string;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  score: number;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  urgentActions?: string[];
  detailedAnalysis?: string;
}

const QUESTION_TEMPLATES = [
  {
    id: 'age',
    questions: [
      "How old are you?",
      "What's your age?",
      "Can you tell me your age?",
      "Mind sharing how old you are?",
    ],
    type: 'slider',
    min: 18,
    max: 100,
    unit: 'years',
  },
  {
    id: 'gender',
    questions: [
      "What is your biological sex?",
      "Are you male or female?",
      "What's your gender assigned at birth?",
    ],
    type: 'multiple',
    options: ['Male', 'Female', 'Prefer not to say'],
  },
  {
    id: 'smoke',
    questions: [
      "Do you smoke tobacco?",
      "Are you a smoker?",
      "Do you currently smoke cigarettes?",
      "Have you smoked in the past 6 months?",
    ],
    type: 'yesno',
  },
  {
    id: 'alcohol',
    questions: [
      "How often do you drink alcohol?",
      "What's your alcohol consumption like?",
      "How frequently do you consume alcoholic beverages?",
    ],
    type: 'multiple',
    options: ['Never', 'Occasionally (1-2/month)', 'Regularly (1-2/week)', 'Frequently (3+/week)', 'Daily'],
  },
  {
    id: 'exercise',
    questions: [
      "How many days per week do you exercise for at least 30 minutes?",
      "How often do you do physical activity each week?",
      "On average, how many days a week are you physically active?",
    ],
    type: 'slider',
    min: 0,
    max: 7,
    unit: 'days/week',
  },
  {
    id: 'diet',
    questions: [
      "How would you describe your diet?",
      "What's your typical eating pattern like?",
      "How healthy is your diet overall?",
    ],
    type: 'multiple',
    options: ['Very healthy (mostly whole foods)', 'Moderately healthy', 'Average (mixed)', 'Poor (mostly processed)'],
  },
  {
    id: 'bmi',
    questions: [
      "What's your Body Mass Index (BMI)? You can estimate if unsure.",
      "Do you know your BMI? Take your best guess.",
      "Can you estimate your BMI (weight in kg ÷ height in m²)?",
    ],
    type: 'slider',
    min: 15,
    max: 50,
    unit: 'kg/m²',
  },
  {
    id: 'sleep',
    questions: [
      "How many hours do you sleep per night on average?",
      "What's your typical sleep duration?",
      "How much sleep do you get each night?",
    ],
    type: 'slider',
    min: 3,
    max: 12,
    unit: 'hours',
  },
  {
    id: 'bloodPressure',
    questions: [
      "Do you have high blood pressure?",
      "Have you been diagnosed with hypertension?",
      "Is your blood pressure elevated?",
    ],
    type: 'multiple',
    options: ['No', 'Yes, controlled with medication', 'Yes, uncontrolled', "Don't know"],
  },
  {
    id: 'diabetes',
    questions: [
      "Have you been diagnosed with diabetes?",
      "Do you have diabetes?",
      "Are you diabetic?",
    ],
    type: 'yesno',
  },
  {
    id: 'familyHistory',
    questions: [
      "Does your family have a history of heart disease, diabetes, or cancer?",
      "Any family history of major diseases like heart disease, diabetes, or cancer?",
      "Have close relatives been diagnosed with heart disease, diabetes, or cancer?",
    ],
    type: 'yesno',
  },
  {
    id: 'stress',
    questions: [
      "How would you rate your stress level?",
      "How stressed do you feel on a regular basis?",
      "What's your typical stress level?",
    ],
    type: 'multiple',
    options: ['Low', 'Moderate', 'High', 'Very High'],
  },
];

class GeminiService {
  private answers: Answer[] = [];
  private questionCount = 0;
  private usedQuestionIds: Set<string> = new Set();
  private readonly MAX_QUESTIONS = 12;
  private readonly USE_AI: boolean;
  private readonly API_KEY: string;
  private aiQuestionsGenerated = 0;
  private readonly MAX_AI_QUESTIONS_PER_SESSION = 2; // Limit AI questions to save quota
  private readonly GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Model available in v1beta

  constructor() {
    this.API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    this.USE_AI = this.API_KEY !== '' && true;
    
    if (this.USE_AI) {
      console.log('✅ Gemini AI enabled with', this.GEMINI_MODEL, '(limited to', this.MAX_AI_QUESTIONS_PER_SESSION, 'AI questions per session)');
    } else {
      console.log('⚠️ Gemini AI disabled - using hardcoded questions only');
    }
  }

  async getNextQuestion(): Promise<Question | null> {
    if (this.questionCount >= this.MAX_QUESTIONS) {
      return null;
    }

    // Use AI only for 2 questions (questions 9 and 10) to save quota
    const shouldUseAI = this.USE_AI && 
                       this.questionCount >= 8 && 
                       this.questionCount < 10 &&
                       this.aiQuestionsGenerated < this.MAX_AI_QUESTIONS_PER_SESSION;

    if (shouldUseAI) {
      try {
        const aiQuestion = await this.getAIQuestion();
        this.aiQuestionsGenerated++;
        return aiQuestion;
      } catch (error) {
        console.error('AI failed, falling back to hardcoded:', error);
        return this.getHardcodedQuestion();
      }
    } else {
      return this.getHardcodedQuestion();
    }
  }

  private getHardcodedQuestion(): Question {
    let template = QUESTION_TEMPLATES.find(t => !this.usedQuestionIds.has(t.id));
    
    if (!template) {
      template = QUESTION_TEMPLATES[this.questionCount % QUESTION_TEMPLATES.length];
    }

    this.usedQuestionIds.add(template.id);
    this.questionCount++;

    const questionText = Array.isArray(template.questions)
      ? template.questions[Math.floor(Math.random() * template.questions.length)]
      : template.questions;

    return {
      id: template.id,
      question: questionText,
      type: template.type as any,
      options: template.options,
      min: template.min,
      max: template.max,
      unit: template.unit,
      required: true,
      aiGenerated: false,
    };
  }

  private async getAIQuestion(): Promise<Question> {
    if (!this.API_KEY) {
      throw new Error('API key not configured');
    }

    const prompt = this.buildSmartFollowUpPrompt();
    
    console.log('🤖 Calling Gemini API for AI question...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.GEMINI_MODEL}:generateContent?key=${this.API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 API Response:', JSON.stringify(data, null, 2));
    
    // Check for safety blocks or other issues
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      console.error('❌ Response blocked by safety filters');
      throw new Error('Response blocked by safety filters');
    }
    
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response truncated due to max tokens');
    }
    
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('❌ Invalid API response structure:', data);
      throw new Error('Invalid API response: no candidates found');
    }
    
    const candidate = data.candidates[0];
    
    // Handle missing content parts
    if (!candidate.content?.parts || candidate.content.parts.length === 0) {
      console.error('❌ Missing content in API response:', candidate);
      throw new Error('Invalid API response: missing content parts');
    }
    
    const aiResponse = candidate.content.parts[0].text?.trim();
    
    if (!aiResponse) {
      console.error('❌ Empty text in API response');
      throw new Error('Invalid API response: empty text');
    }
    
    console.log('✅ AI Response Text:', aiResponse);
    
    const question = this.parseAIQuestion(aiResponse);
    this.questionCount++;
    return question;
  }

  private buildSmartFollowUpPrompt(): string {
    let context = 'You are a health assessment assistant. Based on these answers, generate ONE relevant follow-up question:\n\n';
    
    this.answers.slice(-3).forEach(a => {
      context += `Q: ${a.question}\nA: ${a.value}\n\n`;
    });

    const alreadyAsked = Array.from(this.usedQuestionIds).join(', ');

    context += `Already covered: ${alreadyAsked}. 

Ask about something NEW and relevant like: medications, chronic conditions, mental health, water intake, screen time, preventive screenings, or recent symptoms.

Keep the question under 12 words and conversational.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

Format for yes/no questions:
{"question": "Do you take any daily medications?", "type": "yesno", "options": ["Yes", "No"]}

Format for multiple choice:
{"question": "How often do you check your blood sugar?", "type": "multiple", "options": ["Never", "Weekly", "Daily", "Multiple times daily"]}

Format for slider:
{"question": "How many hours per day do you use screens?", "type": "slider", "min": 0, "max": 16, "unit": "hours"}

Respond with ONLY the JSON object:`;

    return context;
  }

  private parseAIQuestion(aiResponse: string): Question {
    try {
      const cleaned = aiResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response:', aiResponse);
        throw new Error('No JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.question || !parsed.type) {
        console.error('❌ Invalid question format:', parsed);
        throw new Error('Missing required fields in AI question');
      }
      
      // Validate type
      const validTypes = ['yesno', 'multiple', 'slider', 'text', 'number'];
      if (!validTypes.includes(parsed.type)) {
        console.error('❌ Invalid question type:', parsed.type);
        parsed.type = 'text'; // Default fallback
      }
      
      // Ensure yesno has proper options
      if (parsed.type === 'yesno' && (!parsed.options || parsed.options.length !== 2)) {
        parsed.options = ['Yes', 'No'];
      }
      
      // Validate slider has min/max
      if (parsed.type === 'slider') {
        if (typeof parsed.min !== 'number') parsed.min = 0;
        if (typeof parsed.max !== 'number') parsed.max = 10;
      }
      
      console.log('✅ Parsed AI Question:', parsed);
      
      return {
        id: `ai_${this.questionCount}`,
        question: parsed.question,
        type: parsed.type,
        options: parsed.options,
        min: parsed.min,
        max: parsed.max,
        unit: parsed.unit,
        required: true,
        aiGenerated: true,
      };
    } catch (error) {
      console.error('❌ Parse error:', error);
      console.error('Raw response:', aiResponse);
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  saveAnswer(question: Question, value: string | number | boolean) {
    this.answers.push({
      questionId: question.id,
      value,
      question: question.question,
    });
  }

  async generateRiskAssessment(): Promise<RiskAssessment> {
    const localAssessment = this.calculateLocalRiskScore();

    // Only use AI enhancement if enabled and we haven't exceeded quota
    if (this.USE_AI && this.API_KEY) {
      try {
        return await this.generateAIEnhancedReport(localAssessment);
      } catch (error) {
        console.error('AI report failed, using local:', error);
        return localAssessment;
      }
    }

    return localAssessment;
  }

  private calculateLocalRiskScore(): RiskAssessment {
    let score = 0;
    const keyFindings: string[] = [];
    const recommendations: string[] = [];
    const urgentActions: string[] = [];

    const age = Number(this.getAnswer('age'));
    if (age > 60) {
      score += 15;
      keyFindings.push('Age is a significant risk factor for NCDs');
    } else if (age > 45) {
      score += 10;
      keyFindings.push('Age-related risk factors are beginning to emerge');
    }

    if (this.getAnswer('smoke') === true || this.getAnswer('smoke') === 'Yes') {
      score += 25;
      urgentActions.push('Quit smoking immediately - single most important health action');
      keyFindings.push('Smoking significantly increases cardiovascular and cancer risk');
    }

    const alcohol = String(this.getAnswer('alcohol'));
    if (alcohol.includes('Daily')) {
      score += 20;
      recommendations.push('Reduce alcohol consumption to recommended limits');
    } else if (alcohol.includes('Frequently')) {
      score += 15;
    }

    const exercise = Number(this.getAnswer('exercise'));
    if (exercise < 2) {
      score += 15;
      keyFindings.push('Physical activity levels are below recommended guidelines');
      recommendations.push('Aim for at least 150 minutes of moderate exercise weekly');
    } else if (exercise < 4) {
      score += 8;
      recommendations.push('Increase physical activity to 5+ days per week');
    } else {
      recommendations.push('Maintain your excellent exercise routine');
    }

    const bmi = Number(this.getAnswer('bmi'));
    if (bmi > 35) {
      score += 20;
      urgentActions.push('Consult healthcare provider about weight management');
      keyFindings.push('BMI indicates obesity, significantly increasing health risks');
    } else if (bmi > 30) {
      score += 15;
      keyFindings.push('BMI is in obese range, increasing metabolic disease risk');
    } else if (bmi > 25) {
      score += 8;
      recommendations.push('Work towards healthy BMI range (18.5-24.9)');
    } else if (bmi < 18.5) {
      score += 10;
      recommendations.push('Consider consultation for healthy weight gain');
    }

    const bp = String(this.getAnswer('bloodPressure'));
    if (bp.includes('uncontrolled')) {
      score += 25;
      urgentActions.push('Seek immediate medical attention for blood pressure control');
      keyFindings.push('Uncontrolled hypertension dramatically increases stroke and heart attack risk');
    } else if (bp.includes('controlled')) {
      score += 10;
      recommendations.push('Continue blood pressure medication as prescribed');
    }

    if (this.getAnswer('diabetes') === true || this.getAnswer('diabetes') === 'Yes') {
      score += 20;
      keyFindings.push('Diabetes requires ongoing management and monitoring');
      recommendations.push('Maintain strict blood sugar control and regular A1C testing');
    }

    if (this.getAnswer('familyHistory') === true || this.getAnswer('familyHistory') === 'Yes') {
      score += 12;
      keyFindings.push('Family history increases your genetic predisposition to NCDs');
      recommendations.push('More frequent health screenings recommended due to family history');
    }

    const stress = String(this.getAnswer('stress'));
    if (stress === 'Very High') {
      score += 15;
      keyFindings.push('Very high stress levels impact both physical and mental health');
      recommendations.push('Implement stress management techniques like meditation or therapy');
    } else if (stress === 'High') {
      score += 10;
      recommendations.push('Practice regular stress reduction activities');
    }

    const sleep = Number(this.getAnswer('sleep'));
    if (sleep < 6 || sleep > 9) {
      score += 10;
      keyFindings.push('Sleep duration outside optimal range affects overall health');
      recommendations.push('Aim for 7-8 hours of quality sleep nightly');
    }

    const diet = String(this.getAnswer('diet'));
    if (diet.includes('Poor')) {
      score += 15;
      keyFindings.push('Poor diet quality significantly increases disease risk');
      recommendations.push('Increase intake of fruits, vegetables, and whole grains');
    } else if (diet.includes('Average')) {
      score += 8;
      recommendations.push('Improve diet quality with more whole foods');
    }

    recommendations.push('Schedule regular check-ups with your healthcare provider');
    recommendations.push('Stay hydrated with 8+ glasses of water daily');
    
    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
    let summary: string;

    if (score >= 75) {
      riskLevel = 'very-high';
      summary = 'Your assessment indicates very high risk for NCDs. Immediate action and medical consultation are strongly recommended to address multiple concerning factors.';
    } else if (score >= 50) {
      riskLevel = 'high';
      summary = 'You have a high risk for developing NCDs. Several factors require attention, but positive changes can significantly improve your health outlook.';
    } else if (score >= 25) {
      riskLevel = 'moderate';
      summary = 'Your NCD risk is moderate. While some areas need improvement, you have a good foundation to build upon with targeted lifestyle changes.';
    } else {
      riskLevel = 'low';
      summary = 'You have a low risk for NCDs. Continue your healthy habits and maintain regular preventive care to keep it that way.';
    }

    return {
      riskLevel,
      score: Math.min(score, 100),
      summary,
      keyFindings: keyFindings.slice(0, 5),
      recommendations: recommendations.slice(0, 6),
      urgentActions: urgentActions.length > 0 ? urgentActions : undefined,
      detailedAnalysis: this.generateDetailedAnalysis(score, riskLevel),
    };
  }

  private async generateAIEnhancedReport(localAssessment: RiskAssessment): Promise<RiskAssessment> {
    const prompt = `You are a medical AI assistant. Analyze this health assessment data and provide a detailed report.

HEALTH ASSESSMENT DATA:
${this.answers.map(a => `${a.question}: ${a.value}`).join('\n')}

PRELIMINARY ANALYSIS:
Risk Level: ${localAssessment.riskLevel}
Risk Score: ${localAssessment.score}/100

TASK: Write a comprehensive 4-paragraph analysis covering:
1. Cardiovascular health assessment
2. Metabolic health factors
3. Lifestyle impact on overall health
4. Specific preventive measures and next steps

Keep response under 400 words. Be specific, actionable, and evidence-based.`;

    console.log('🤖 Calling Gemini API for enhanced risk assessment...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.GEMINI_MODEL}:generateContent?key=${this.API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error('AI request failed');
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid API response structure');
    }
    
    const aiAnalysis = data.candidates[0].content.parts[0].text.trim();
    console.log('✅ AI-enhanced analysis generated');

    return {
      ...localAssessment,
      detailedAnalysis: aiAnalysis,
    };
  }

  private generateDetailedAnalysis(score: number, riskLevel: string): string {
    return `Your health assessment reveals several important factors affecting your NCD risk profile. 

Cardiovascular Health: Based on your responses regarding exercise, diet, blood pressure, and smoking status, your cardiovascular risk profile requires attention. Regular physical activity, blood pressure monitoring, and lifestyle modifications are essential preventive measures.

Metabolic Health: Your weight status, diet quality, and family history contribute to your metabolic disease risk. Maintaining a healthy weight through balanced nutrition and regular activity can significantly reduce your risk of type 2 diabetes and metabolic syndrome.

Lifestyle Factors: Sleep quality, stress management, and daily habits play crucial roles in overall health. Establishing consistent sleep patterns, implementing stress reduction techniques, and avoiding harmful substances will support your long-term wellness.

Preventive Measures: Regular health screenings, maintaining awareness of family health history, and proactive engagement with healthcare providers are key to early detection and prevention. Your ${riskLevel} risk level indicates the need for ${score > 50 ? 'immediate' : 'ongoing'} attention to these areas.`;
  }

  private getAnswer(questionId: string): any {
    return this.answers.find(a => a.questionId === questionId)?.value;
  }

  getAnswers(): Answer[] {
    return this.answers;
  }

  getProgress(): number {
    return Math.round((this.questionCount / this.MAX_QUESTIONS) * 100);
  }

  reset() {
    this.answers = [];
    this.questionCount = 0;
    this.usedQuestionIds.clear();
    this.aiQuestionsGenerated = 0;
  }
}

export const geminiService = new GeminiService();