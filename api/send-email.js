// Vercel Serverless Function: /api/send-email
// รองรับการส่งอีเมลจริงหาลูกค้าอัตโนมัติผ่าน Resend API
export default async function handler(req, res) {
  // CORS
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

  const { recipient, subject, message, download_links, carrier, tracking_number } = req.body || {};

  if (!recipient || !subject) {
    return res.status(400).json({ error: "Missing recipient or subject" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return res.status(200).json({
      success: false,
      configured: false,
      message: "Resend API Key is not set in Vercel Environment Variables. Use 1-click Gmail send fallback."
    });
  }

  try {
    let emailHtml = `
      <div style="font-family: 'Prompt', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #FF758F; margin: 0;">🎨 Wadfan Studio</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">วาดฝัน สตูดิโอ - ภาพวาดดิจิทัล & ใบงานการเรียนรู้</p>
        </div>
        <div style="font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-line;">
          ${message || ""}
        </div>
    `;

    if (download_links && download_links.length > 0) {
      emailHtml += `
        <div style="margin-top: 20px; padding: 16px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
          <h3 style="color: #0369a1; margin: 0 0 10px 0; font-size: 16px;">📁 ลิงก์ดาวน์โหลดใบงานของคุณจาก Google Drive:</h3>
      `;
      for (const link of download_links) {
        emailHtml += `
          <div style="margin-bottom: 10px;">
            <strong>📄 ${link.title}</strong><br>
            <a href="${link.url}" target="_blank" style="color: #0284c7; font-weight: bold; text-decoration: underline;">👉 คลิกดาวน์โหลดไฟล์จาก Google Drive</a>
          </div>
        `;
      }
      emailHtml += `</div>`;
    }

    if (tracking_number) {
      let trackingUrl = "";
      const c = (carrier || "").toLowerCase();
      if (c.includes("kerry")) {
        trackingUrl = `https://th.kerryexpress.com/th/track/?track=${tracking_number}`;
      } else if (c.includes("flash")) {
        trackingUrl = `https://www.flashexpress.co.th/tracking/?se=${tracking_number}`;
      } else if (c.includes("ems") || c.includes("ไปรษณีย์")) {
        trackingUrl = `https://track.thailandpost.co.th/?trackNumber=${tracking_number}`;
      } else if (c.includes("j&t") || c.includes("jt")) {
        trackingUrl = `https://www.jtexpress.co.th/index/query/gzquery.html?bills=${tracking_number}`;
      }

      emailHtml += `
        <div style="margin-top: 20px; padding: 16px; background: #ebf5fb; border-radius: 8px; border: 1px solid #7bc5dc;">
          <h3 style="color: #0369a1; margin: 0 0 10px 0; font-size: 16px;">🚚 ข้อมูลการจัดส่งพัสดุ:</h3>
          <p style="margin: 6px 0;"><strong>บริษัทขนส่ง:</strong> ${carrier || "Kerry Express"}</p>
          <p style="margin: 6px 0;"><strong>หมายเลขพัสดุ:</strong> <span style="font-size: 18px; color: #ff758f; font-weight: bold;">${tracking_number}</span></p>
          ${trackingUrl ? `<p style="margin: 8px 0 0 0;"><a href="${trackingUrl}" target="_blank" style="color: #0284c7; font-weight: bold;">🔍 คลิกตรวจสอบสถานะพัสดุแบบเรียลไทม์</a></p>` : ""}
        </div>
      `;
    }

    emailHtml += `
        <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center;">
          ขอบคุณที่ไว้วางใจและสนับสนุนร้าน Wadfan Studio ครับ ❤️
        </div>
      </div>
    `;

    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Wadfan Studio <onboarding@resend.dev>",
        to: [recipient],
        subject: subject,
        html: emailHtml
      })
    });

    let resendData = await resendRes.json();

    // หาก Resend แจ้งเตือนข้อจำกัด Free Sandbox (ส่งหาคนอื่นไม่ได้นอกจากเจ้าของบัญชี wongsakorn.pr1996@gmail.com)
    if (!resendRes.ok && resendData.message && resendData.message.includes("own email address")) {
      console.warn("Resend test mode detected: forwarding email to owner wongsakorn.pr1996@gmail.com instead...");

      const adminFallbackRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Wadfan Studio <onboarding@resend.dev>",
          to: ["wongsakorn.pr1996@gmail.com"],
          subject: `[ส่งหาลูกค้า: ${recipient}] ${subject}`,
          html:
            `<div style="background:#FFFBEB;padding:12px;border:1px solid #FCD34D;border-radius:8px;margin-bottom:16px;font-size:14px;color:#92400E;"><strong>📢 แจ้งเตือนแอดมิน:</strong> อีเมลนี้เป็นสำเนาที่ส่งให้ลูกค้า <code>${recipient}</code> แต่เนื่องจากโดเมน Resend ของคุณอยู่ในช่วงทดสอบ (ยังไม่ได้ผูกชื่อโดเมนตัวเอง) ระบบจึงส่งสำเนาแจ้งเตือนมาที่ Gmail ของคุณแทนครับ</div>` +
            emailHtml
        })
      });

      if (adminFallbackRes.ok) {
        return res.status(200).json({
          success: true,
          forwardedToAdmin: true,
          message: "ส่งเข้า Gmail แอดมิน wongsakorn.pr1996@gmail.com เรียบร้อยแล้ว (Resend Test Mode)"
        });
      }
    }

    if (!resendRes.ok) {
      throw new Error(resendData.message || "Failed to send email via Resend");
    }

    return res.status(200).json({ success: true, id: resendData.id });
  } catch (err) {
    console.error("API send-email error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
