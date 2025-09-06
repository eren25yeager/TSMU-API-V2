// File: api/get-data.js

export default async function handler(request, response) {
  // 1. استخراج كود العضو من رابط الطلب
  const { code } = request.query;
  if (!code) {
    return response.status(400).json({ message: "Member code is required." });
  }

  // 2. استخراج مفتاح API من متغيرات البيئة الآمنة
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ message: "API key is not configured on the server." });
  }

  // 3. تعريف معلومات Google Sheet
  const spreadsheetId = "1aogKee4_jL8K95GAkqzcQmItD6jj9lqSKByATrJqsvo";
  const sheetName = "Control";
  const range = "A:Z"; // اقرأ كل الأعمدة

  // 4. بناء رابط Google Sheets API
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${apiKey}`;

  try {
    // 5. إرسال الطلب إلى Google Sheets API
    const apiResponse = await fetch(apiUrl );
    const data = await apiResponse.json();

    // إذا كان هناك خطأ من Google API نفسه
    if (data.error) {
      return response.status(data.error.code).json({ message: data.error.message });
    }

    // 6. معالجة البيانات المستلمة
    const headers = data.values[0];
    const rows = data.values.slice(1);
    
    const codeColumnIndex = headers.findIndex(h => h.toLowerCase() === 'code');
    if (codeColumnIndex === -1) {
      return response.status(500).json({ message: "Header 'Code' not found in the sheet." });
    }

    // البحث عن العضو المطابق
    const memberRow = rows.find(row => String(row[codeColumnIndex]).trim().toLowerCase() === String(code).trim().toLowerCase());

    if (!memberRow) {
      return response.status(200).json({ found: false, message: "Code not found" });
    }

    // 7. تجميع بيانات العضو في كائن واحد
    const memberData = {};
    headers.forEach((header, index) => {
      memberData[header] = memberRow[index] || ''; // تأكد من وجود قيمة
    });
    
    // معالجة رابط الصورة (اختياري لكن مهم)
    const photoUrlIndex = headers.findIndex(h => h.toLowerCase() === 'photo url');
    if (photoUrlIndex !== -1) {
        const originalUrl = memberRow[photoUrlIndex];
        if (originalUrl) {
            const fileIdMatch = String(originalUrl).match(/d\/(.+?)\//);
            if (fileIdMatch && fileIdMatch[1]) {
                memberData["DirectPhotoLink"] = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
            }
        }
    }

    // 8. إرسال الرد الناجح إلى الواجهة الأمامية
    return response.status(200 ).json({ found: true, data: memberData });

  } catch (error) {
    // إرسال أي خطأ غير متوقع
    console.error("Server-side error:", error);
    return response.status(500).json({ message: "An internal server error occurred.", details: error.message });
  }
}
