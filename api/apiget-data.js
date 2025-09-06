// File: api/get-data.js
// ⚠️ تحذير: هذا الكود يحتوي على مفتاح API بشكل مباشر وهو غير آمن.

export default async function handler(request, response) {
  // تم وضع المفتاح مباشرة هنا كما طلبت
  const apiKey = "AIzaSyAp8ahGjn5XyTjtwvgUIQjucjd0AM1bJNU";
  
  const spreadsheetId = '1aogKee4_jL8K95GAkqzcQmItD6jj9lqSKByATrJqsvo';
  const { code } = request.query;

  if (!code) {
    return response.status(400).json({ message: 'Member code is required.' });
  }

  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Control?key=${apiKey}`;

  try {
    const sheetsResponse = await fetch(apiUrl );
    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.json();
      throw new Error(`Google Sheets API error: ${errorData.error.message}`);
    }
    
    const result = await sheetsResponse.json();
    const data = result.values;
    const headers = data.shift();
    const codeColumnIndex = headers.map(h => h.toLowerCase()).indexOf("code");

    if (codeColumnIndex === -1) {
      return response.status(500).json({ found: false, message: "Header 'Code' not found." });
    }

    const resultRow = data.find(row => String(row[codeColumnIndex]).trim().toLowerCase() === String(code).trim().toLowerCase());

    if (!resultRow) {
      return response.status(200).json({ found: false, message: "Code not found" });
    }

    const memberData = {};
    headers.forEach((header, index) => {
      memberData[header] = resultRow[index];
    });

    const photoUrlIndex = headers.map(h => h.toLowerCase()).indexOf("photo url");
    if (photoUrlIndex !== -1) {
        const originalUrl = resultRow[photoUrlIndex];
        if (originalUrl && String(originalUrl).trim() !== '') {
            const fileIdMatch = String(originalUrl).match(/d\/(.+?)\//);
            if (fileIdMatch && fileIdMatch[1]) {
                memberData["DirectPhotoLink"] = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
            }
        }
    }
    
    response.status(200 ).json({ found: true, data: memberData });

  } catch (error) {
    response.status(500).json({ found: false, message: "Server error: " + error.message });
  }
}
