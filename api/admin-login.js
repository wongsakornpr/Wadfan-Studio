const {
  createSession,
  sessionCookie,
  SESSION_DURATION
} = require("../lib/admin-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const password = String(req.body?.password || "");

    if (!password || password.length > 200) {
      return res.status(400).json({ success: false, message: "กรุณากรอกรหัสผ่าน" });
    }

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/verify_admin_password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ p_password: password })
      }
    );

    if (!response.ok) {
      console.error("Admin password verification failed:", response.status);
      return res.status(500).json({ success: false, message: "ระบบตรวจสอบขัดข้อง" });
    }

    const isValid = await response.json();

    if (isValid !== true) {
      return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = createSession();

    res.setHeader("Set-Cookie", sessionCookie(token, SESSION_DURATION));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
};