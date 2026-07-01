import { File } from 'expo-file-system/next';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface ExtractedMenuItem {
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
}

export interface ExtractionResult {
  items: ExtractedMenuItem[];
  unclear: string[];
}

const EXTRACTION_PROMPT = `Extract menu items from this restaurant menu image. Return ONLY valid JSON in this exact format:
{
  "items": [
    { "name": "Item Name", "price": 100, "category": "Category Name", "isVeg": true }
  ],
  "unclear": ["description of unclear item 1", "description of unclear item 2"]
}

Rules:
- Extract item name, price (number only, no currency symbol), category (from menu section headers), isVeg (true/false)
- Detect veg/non-veg from: green/red symbols, "veg"/"non-veg" labels, or infer from ingredients (chicken/mutton/egg = non-veg)
- If category header not visible, use "Uncategorized"
- Put items that are hard to read or ambiguous in the "unclear" array with best-effort description
- Price must be a number, not string
- Return empty arrays if nothing can be extracted
- IMPORTANT: If multiple items are listed together separated by "/" or ","or any other separator (e.g. "Ginger Chicken / Dragon Chicken / Pepper Chicken"), split them into SEPARATE entries with the same price`;

async function imageToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  const base64 = await file.base64();
  return base64;
}

export async function extractMenuFromImages(imageUris: string[]): Promise<ExtractionResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const imageParts = await Promise.all(
    imageUris.map(async (uri) => {
      const base64 = await imageToBase64(uri);
      return {
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64,
        },
      };
    })
  );

  const requestBody = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          ...imageParts,
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse menu data');
  }

  const result: ExtractionResult = JSON.parse(jsonMatch[0]);
  
  // Validate and clean data
  result.items = (result.items || []).map(item => ({
    name: String(item.name || '').trim(),
    price: Number(item.price) || 0,
    category: String(item.category || 'Uncategorized').trim(),
    isVeg: Boolean(item.isVeg),
  })).filter(item => item.name && item.price > 0);

  result.unclear = result.unclear || [];

  return result;
}
