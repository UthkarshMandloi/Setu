import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock-key");

export async function verifyDocument(extractedText: string, docType: string) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
    // Generate a pseudo-random verdict based on text length for demo variety
    const lengthMod = extractedText.length % 3;
    const mockVerdict = lengthMod === 0 ? "VERIFIED" : lengthMod === 1 ? "NEEDS_REVIEW" : "REJECTED";
    
    return {
      fieldsFound: ["Company Name", "Registration Number", "Date of Issue"],
      missingFields: mockVerdict === "VERIFIED" ? [] : ["Authorized Signature"],
      inconsistencies: mockVerdict === "NEEDS_REVIEW" ? "Simulated mock verification: Dates appear older than 6 months." : mockVerdict === "REJECTED" ? "Document appears to be tampered." : "",
      confidence: mockVerdict === "VERIFIED" ? 0.95 : 0.65,
      verdict: mockVerdict
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    You are an AI verification assistant for the Indian government's Setu platform.
    Analyze the following extracted text from a document of type: ${docType}.
    Extract the relevant fields you can find (e.g. CIN, dates, company name, PAN).
    Identify any missing mandatory fields for this type of document.
    Flag any inconsistencies (e.g. name mismatch, expired date).
    Return a STRICT JSON response with this exact schema and no markdown formatting:
    {
      "fieldsFound": ["field1", "field2"],
      "missingFields": ["missing1"],
      "inconsistencies": "text description or empty",
      "confidence": 0.0 to 1.0,
      "verdict": "VERIFIED" | "NEEDS_REVIEW" | "REJECTED"
    }

    Text:
    ${extractedText.substring(0, 5000)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || "{}";
    const parsed = JSON.parse(jsonStr);
    return {
      fieldsFound: parsed.fieldsFound || [],
      missingFields: parsed.missingFields || [],
      inconsistencies: parsed.inconsistencies || "",
      confidence: parsed.confidence || 0.5,
      verdict: parsed.verdict || "NEEDS_REVIEW"
    };
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return {
      fieldsFound: [],
      missingFields: [],
      inconsistencies: "Error processing document with AI",
      confidence: 0,
      verdict: "NEEDS_REVIEW"
    };
  }
}
