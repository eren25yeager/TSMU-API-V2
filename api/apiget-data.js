// File: api/get-data.js (Diagnostic Version)

export default async function handler(request, response) {
  console.log("✅ [1/8] Serverless function started.");

  try {
    const { code } = request.query;
    console.log(`✅ [2/8] Received request for code: ${code}`);
    if (!code) {
      console.error("❌ [ERROR] Code is missing from request.");
      return response.status(400).json({ message: "Member code is required." });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    // لا تطبع المفتاح كاملاً أبداً، فقط تأكد من وجوده
    console.log(`✅ [3/8] API Key found: ${apiKey ? 'Yes' : 'No'}`);
    if (!apiKey) {
      console.error("❌ [ERROR] GOOGLE_API_KEY environment variable is not set.");
      return response.status(500).json({ message: "API key is not configured on the server." });
    }

    const spreadsheetId = "1aogKee4_jL8K95GAkqzcQmItD6jj9lqSKByATrJqsvo";
    const sheetName = "Control";
    const range = "A:Z";
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${apiKey}`;
    console.log("✅ [4/8] Constructed API URL. Ready to fetch." );

    const apiResponse = await fetch(apiUrl);
    console.log(`✅ [5/8] Fetched from Google. Status: ${apiResponse.status} ${apiResponse.statusText}`);

    // سنقرأ الرد كنص أولاً لتشخيص أي خطأ HTML
    const responseText = await apiResponse.text();
    console.log("✅ [6/8] Received response text from Google (first 100 chars):", responseText.substring(0, 100));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ [FATAL ERROR] Failed to parse Google's response as JSON. The response was likely an HTML error page.");
      // أرجع النص الفعلي للمساعدة في التشخيص
      return response.status(500).json({ message: "Google API did not return valid JSON.", response: responseText });
    }

    if (data.error) {
      console.error("❌ [ERROR] Google API returned an error object:", data.error);
      return response.status(data.error.code || 500).json({ message: data.error.message });
    }

    console.log("✅ [7/8] Successfully parsed JSON. Processing data...");
    const headers = data.values[0];
    const rows = data.values.slice(1);
    const codeColumnIndex = headers.findIndex(h => h.toLowerCase() === 'code');
    const memberRow = rows.find(row => String(row[codeColumnIndex]).trim().toLowerCase() === String(code).trim().toLowerCase());

    if (!memberRow) {
      console.log("ℹ️ Member code not found in sheet.");
      return response.status(200).json({ found: false, message: "Code not found" });
    }

    const memberData = {};
    headers.forEach((header, index) => { memberData[header] = memberRow[index] || ''; });
    
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

    console.log("✅ [8/8] Successfully found member. Sending data to client." );
    return response.status(200).json({ found: true, data: memberData });

  } catch (error) {
    console.error("❌ [UNCAUGHT ERROR] An unexpected error occurred in the handler:", error);
    return response.status(500).json({ message: "An internal server error occurred.", details: error.message });
  }
}
