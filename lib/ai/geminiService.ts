import { GoogleGenerativeAI } from '@google/generative-ai'
import { ManipulationTechnique, AIAnalysis } from '@/types/game'

const topics = ['קפה', 'לימודים', 'טכנולוגיה', 'חיות', 'מזג אוויר', 'ספורט', 'מוזיקה', 'מסעדות']
const techniques: ManipulationTechnique[] = [
  'emotional_language',
  'false_dilemma',
  'scapegoating',
  'ad_hominem',
  'inconsistency',
  'appeal_to_authority',
  'bandwagon',
  'slippery_slope',
]

const techniqueNames: Record<ManipulationTechnique, string> = {
  emotional_language: 'שפה רגשית',
  false_dilemma: 'דילמה כוזבת',
  scapegoating: 'העברת אשמה',
  ad_hominem: 'התקפה אישית',
  inconsistency: 'אי עקביות',
  appeal_to_authority: 'פניה לסמכות',
  bandwagon: 'אפקט העדר',
  slippery_slope: 'מדרון חלקלק',
}

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key is not configured')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export async function generateManipulativePost(): Promise<{
  topic: string
  post: string
  techniques: ManipulationTechnique[]
}> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const topic = topics[Math.floor(Math.random() * topics.length)]
  const numTechniques = Math.floor(Math.random() * 3) + 2 // 2-4 techniques
  const selectedTechniques = techniques
    .sort(() => Math.random() - 0.5)
    .slice(0, numTechniques)

  const techniqueNamesStr = selectedTechniques
    .map((t) => techniqueNames[t])
    .join(', ')

  const prompt = `פוסט בעברית קצר (2-3 משפטים) על "${topic}" עם מניפולציות: ${techniqueNamesStr}. הומוריסטי, לא פוגעני. החזר רק את הפוסט.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const post = response.text().trim()

    return {
      topic,
      post,
      techniques: selectedTechniques,
    }
  } catch (error) {
    console.error('Error generating manipulative post:', error)
    throw error
  }
}

export async function analyzePost(
  post: string,
  topic: string,
  correctTechniques: ManipulationTechnique[]
): Promise<AIAnalysis> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const correctTechniquesStr = correctTechniques
    .map((t) => techniqueNames[t])
    .join(', ')

  const prompt = `פוסט מניפולטיבי: "${post}"
הפוסט משתמש בטכניקות: ${correctTechniquesStr}

צור גרסה ניטרלית של אותו פוסט - אותה מסר אבל ללא מניפולציה רגשית, ללא דילמות כוזבות, ללא התקפות אישיות, ללא העברת אשמה. שמור על אותו נושא ותוכן אבל בצורה מאוזנת וניטרלית.

החזר JSON בלבד:
{
  "explanation": "הסבר קצר (משפט אחד) על הטכניקות המניפולטיביות",
  "neutralAlternative": "גרסה ניטרלית מלאה של הפוסט (2-3 משפטים, אותה מסר אבל ללא מניפולציה)",
  "manipulationLevel": 50,
  "aiCommentary": "תגובה קצרה"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()

    // Extract JSON from markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Try to extract JSON if it's embedded in text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }

    let analysis
    try {
      analysis = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', text)
      throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Calculate manipulation level if not provided or out of range
    let manipulationLevel = parseInt(analysis.manipulationLevel) || 50
    manipulationLevel = Math.max(0, Math.min(100, manipulationLevel))

    // Weight by number of techniques
    manipulationLevel = Math.min(
      100,
      manipulationLevel + correctTechniques.length * 10
    )

    return {
      correctTechniques,
      explanation: analysis.explanation || '',
      neutralAlternative: analysis.neutralAlternative || '',
      manipulationLevel,
      aiCommentary: analysis.aiCommentary || '',
    }
  } catch (error) {
    console.error('Error analyzing post:', error)
    // Generate a better fallback neutral alternative
    const neutralAlternative = await generateNeutralAlternativeFallback(post, topic)
    return {
      correctTechniques,
      explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
      neutralAlternative,
      manipulationLevel: 50 + correctTechniques.length * 10,
      aiCommentary: 'מניפולציה מעניינת!',
    }
  }
}

async function generateNeutralAlternativeFallback(
  manipulativePost: string,
  topic: string
): Promise<string> {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-3-flash-preview' })
    const prompt = `פוסט מניפולטיבי: "${manipulativePost}"

צור גרסה ניטרלית של הפוסט הזה - אותה מסר אבל ללא מניפולציה רגשית, ללא דילמות כוזבות, ללא התקפות אישיות. שמור על אותו נושא אבל בצורה מאוזנת וניטרלית.

החזר רק את הגרסה הניטרלית, ללא הסברים נוספים.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let neutralText = response.text().trim()
    
    // Clean up the response
    neutralText = neutralText.replace(/^["']|["']$/g, '').trim()
    
    if (neutralText && neutralText.length > 10) {
      return neutralText
    }
  } catch (error) {
    console.error('Error generating fallback neutral alternative:', error)
  }
  
  // Ultimate fallback - create a simple neutral version
  return `דיון על ${topic} בצורה מאוזנת ומבוססת עובדות.`
}

export async function generateAIPlayerGuess(
  post: string,
  topic: string,
  shouldMakeMistake: boolean
): Promise<{
  techniques: ManipulationTechnique[]
  analysis: string
}> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const prompt = `פוסט: "${post}"
${shouldMakeMistake ? 'הוסף טכניקה אחת לא נכונה או החמצה אחת.' : 'זהה נכון.'}
רשימה: ${techniques.map((t) => techniqueNames[t]).join(', ')}
JSON: {"techniques":["technique1"],"analysis":"תגובה קצרה"}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    const guess = JSON.parse(text)

    // Validate techniques
    const validTechniques = (guess.techniques || []).filter((t: string) =>
      techniques.includes(t as ManipulationTechnique)
    ) as ManipulationTechnique[]

    return {
      techniques: validTechniques.length > 0 ? validTechniques : [techniques[0]],
      analysis: guess.analysis || 'נראה מניפולטיבי!',
    }
  } catch (error) {
    console.error('Error generating AI player guess:', error)
    // Random guess with mistake sometimes
    const randomTechniques = techniques
      .sort(() => Math.random() - 0.5)
      .slice(0, shouldMakeMistake ? 1 : 2) as ManipulationTechnique[]

    return {
      techniques: randomTechniques,
      analysis: shouldMakeMistake
        ? 'אני בטוח שזה רק שפה רגשית... או אולי משהו אחר?'
        : 'נראה שיש כאן כמה טכניקות מניפולציה מעניינות!',
    }
  }
}

