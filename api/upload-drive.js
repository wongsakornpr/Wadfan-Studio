// Vercel Serverless Function: /api/upload-drive
// ทำหน้าที่ส่งรูปและสลิปไปบันทึกใน Google Drive ของ wongsakorn.pr1996@gmail.com ผ่าน Google Apps Script
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order_number, customer_name, files, script_url } = req.body || {};

  const googleScriptUrl = script_url || process.env.GOOGLE_SCRIPT_URL;

  if (!googleScriptUrl) {
    return res.status(200).json({
      success: false,
      configured: false,
      message: "ยังไม่ได้ระบุ GOOGLE_SCRIPT_URL ในการตั้งค่า"
    });
  }

  try {
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        order_number: order_number,
        customer_name: customer_name,
        files: files || []
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Upload drive proxy error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
