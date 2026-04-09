import * as xlsx from 'xlsx';
import OpenAI from 'openai';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') }); // Reads from backend/.env

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("Xəta: OPENROUTER_API_KEY tapılmadı! Lütfən backend/.env faylına əlavə edin.");
  process.exit(1);
}

// OpenRouter initialization using OpenAI SDK wrapper
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

async function main() {
  const filePath = path.join(__dirname, '..', 'students_data.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`Xəta: Excel faylı tapılmadı (${filePath}). Əvvəlcə create_mock_excel.ts çalışdırın.`);
    process.exit(1);
  }

  // Read Excel
  console.log("Excel faylı oxunur...");
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Exceldən ${data.length} tələbə rekordu oxundu. AI-ə göndərilir...`);

  // Prepare prompt for AI
  const prompt = `
Sən "Holberton Student Performance Tracking System" layihəsində bir peşəkar təhsil analitikisən. 
Aşağıda tələbələrin performansı barədə məlumatlar (Excel-dən çıxarılmış real datalar) verilib. 
Xahiş edirəm bu məlumatları analiz edərək mentor və adminlər üçün rəsmi bir **"AI Analiz Hesabatı"** yarat.

Tələblərim:
1. Ümumi vəziyyətlə bağlı qısa "Executive Summary" (Xülasə).
2. "Risk altında olan" (At-Risk və ya göstəriciləri zəif olan) tələbələr üçün ayrıca fərdi mentorluq məsləhəti və müdaxilə planı.
3. Yüksək nəticə göstərən tələbələri necə daha irəli aparmaq olar deyə tövsiyə.
4. Mətn strukturlu, oxunaqlı (Markdown formatında) və sırf Azərbaycan dilində olsun.

Data:
${JSON.stringify(data, null, 2)}
`;

  try {
    console.log("OpenRouter-ə sorğu göndərilir (Model: google/gemini-2.5-flash)... (Bu bir neçə saniyə çəkə bilər)");
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash", // Using Gemini through OpenRouter (should be fast and good)
      messages: [
        { role: "system", content: "Sən peşəkar təhsil və performans analitikası mütəxəssisisən." },
        { role: "user", content: prompt }
      ]
    });

    const report = completion.choices[0].message.content;
    
    const reportPath = path.join(__dirname, '..', 'AI_REPORT.md');
    fs.writeFileSync(reportPath, report || "");

    console.log("==================================================");
    console.log("✅ Report uğurla yaradıldı və backend/AI_REPORT.md faylına yazıldı!");
    console.log("==================================================");

  } catch (error: any) {
    console.error("OpenRouter sorğusu zamanı xəta baş verdi:", error?.response?.data || error?.message || error);
  }
}

main();
