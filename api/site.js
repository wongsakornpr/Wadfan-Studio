
const { verifySession } = require("../lib/admin-auth");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = {
  content: "site_content",
  features: "site_features",
  faqs: "site_faqs",
  reviews: "site_reviews"
};

// --------------------------------------------------
// Supabase REST Helper
// --------------------------------------------------
async function dbRequest(table, options = {}) {
  const {
    method = "GET",
    query = "",
    body,
    prefer
  } = options;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${query}`,
    {
      method,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    }
  );

  const text = await response.text();

  if (!response.ok) {
    console.error("Supabase API error:", table, response.status, text);
    throw new Error("Database operation failed");
  }

  return text ? JSON.parse(text) : null;
}

function sendError(res, error) {
  console.error("Site API error:", error);
  return res.status(500).json({
    success: false,
    message: "เกิดข้อผิดพลาดในการดำเนินการ"
  });
}

function requireAdmin(req, res) {
  if (!verifySession(req)) {
    res.status(401).json({
      success: false,
      message: "กรุณาเข้าสู่ระบบผู้ดูแลก่อน"
    });
    return false;
  }

  return true;
}

// --------------------------------------------------
// Public: Get Landing Page Data
// GET /api/site?view=public
// --------------------------------------------------
async function getPublicData(res) {
  const [content, features, faqs, reviews] = await Promise.all([
    dbRequest(TABLES.content, {
      query: "?select=content_key,content_value"
    }),
    dbRequest(TABLES.features, {
      query: "?select=id,icon,title,description,sort_order&is_active=eq.true&order=sort_order.asc"
    }),
    dbRequest(TABLES.faqs, {
      query: "?select=id,question,answer,sort_order&is_active=eq.true&order=sort_order.asc"
    }),
    dbRequest(TABLES.reviews, {
      query: "?select=id,customer_name,rating,review_text,created_at&status=eq.approved&order=created_at.desc&limit=50"
    })
  ]);

  return res.status(200).json({
    success: true,
    content,
    features,
    faqs,
    reviews
  });
}

// --------------------------------------------------
// Public: Submit Customer Review
// POST /api/site
// action: submit-review
// --------------------------------------------------
async function submitReview(req, res) {
  const name = String(req.body?.customer_name || "").trim();
  const review = String(req.body?.review_text || "").trim();
  const rating = Number(req.body?.rating);

  if (!name || name.length > 80) {
    return res.status(400).json({
      success: false,
      message: "กรุณากรอกชื่อไม่เกิน 80 ตัวอักษร"
    });
  }

  if (!review || review.length < 5 || review.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "รีวิวต้องมีความยาว 5–1,000 ตัวอักษร"
    });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "กรุณาเลือกคะแนน 1–5 ดาว"
    });
  }

  await dbRequest(TABLES.reviews, {
    method: "POST",
    query: "?select=id",
    prefer: "return=representation",
    body: {
      customer_name: name,
      rating,
      review_text: review,
      status: "pending"
    }
  });

  return res.status(201).json({
    success: true,
    message: "ส่งรีวิวเรียบร้อยแล้ว กรุณารอการตรวจสอบจากทีมงาน"
  });
}

// --------------------------------------------------
// Admin: Get All Management Data
// GET /api/site?view=admin
// --------------------------------------------------
async function getAdminData(res) {
  const [content, features, faqs, reviews] = await Promise.all([
    dbRequest(TABLES.content, {
      query: "?select=*&order=content_key.asc"
    }),
    dbRequest(TABLES.features, {
      query: "?select=*&order=sort_order.asc"
    }),
    dbRequest(TABLES.faqs, {
      query: "?select=*&order=sort_order.asc"
    }),
    dbRequest(TABLES.reviews, {
      query: "?select=*&order=created_at.desc"
    })
  ]);

  return res.status(200).json({
    success: true,
    content,
    features,
    faqs,
    reviews
  });
}

// --------------------------------------------------
// Admin: Save Landing Page Content
// --------------------------------------------------
async function saveContent(req, res) {
  const rows = req.body?.items;

  if (!Array.isArray(rows) || rows.length > 50) {
    return res.status(400).json({ success: false });
  }

  for (const item of rows) {
    if (
      typeof item.content_key !== "string" ||
      !/^[a-z0-9_]{1,80}$/i.test(item.content_key) ||
      typeof item.content_value !== "string" ||
      item.content_value.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลเนื้อหาไม่ถูกต้อง"
      });
    }
  }

  if (rows.length) {
    await dbRequest(TABLES.content, {
      method: "POST",
      query: "?on_conflict=content_key",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: rows.map(item => ({
        content_key: item.content_key,
        content_value: item.content_value,
        updated_at: new Date().toISOString()
      }))
    });
  }

  return res.status(200).json({ success: true });
}

// --------------------------------------------------
// Admin: Features / FAQ CRUD
// --------------------------------------------------
async function saveListItem(req, res, table, fields) {
  const item = req.body?.item;

  if (!item || typeof item !== "object") {
    return res.status(400).json({ success: false });
  }

  const data = {};

  for (const field of fields) {
    if (item[field] !== undefined) data[field] = item[field];
  }

  if (!Object.keys(data).length) {
    return res.status(400).json({ success: false });
  }

  if (item.id) {
    await dbRequest(table, {
      method: "PATCH",
      query: `?id=eq.${encodeURIComponent(item.id)}`,
      prefer: "return=minimal",
      body: {
        ...data,
        updated_at: new Date().toISOString()
      }
    });
  } else {
    await dbRequest(table, {
      method: "POST",
      prefer: "return=minimal",
      body: data
    });
  }

  return res.status(200).json({ success: true });
}

async function deleteListItem(req, res, table) {
  const id = String(req.body?.id || "");

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ success: false });
  }

  await dbRequest(table, {
    method: "DELETE",
    query: `?id=eq.${encodeURIComponent(id)}`,
    prefer: "return=minimal"
  });

  return res.status(200).json({ success: true });
}

// --------------------------------------------------
// Admin: Moderate Reviews
// --------------------------------------------------
async function moderateReview(req, res) {
  const id = String(req.body?.id || "");
  const status = req.body?.status;

  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["approved", "rejected"].includes(status)
  ) {
    return res.status(400).json({ success: false });
  }

  await dbRequest(TABLES.reviews, {
    method: "PATCH",
    query: `?id=eq.${encodeURIComponent(id)}`,
    prefer: "return=minimal",
    body: {
      status,
      moderated_at: new Date().toISOString()
    }
  });

  return res.status(200).json({ success: true });
}

async function deleteReview(req, res) {
  const id = String(req.body?.id || "");

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ success: false });
  }

  await dbRequest(TABLES.reviews, {
    method: "DELETE",
    query: `?id=eq.${encodeURIComponent(id)}`,
    prefer: "return=minimal"
  });

  return res.status(200).json({ success: true });
}

// --------------------------------------------------
// Main API Handler
// --------------------------------------------------
module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({
      success: false,
      message: "Server configuration is incomplete"
    });
  }

  try {
    if (req.method === "GET") {
      const view = req.query?.view || "public";

      if (view === "public") {
        return await getPublicData(res);
      }

      if (view === "admin") {
        if (!requireAdmin(req, res)) return;
        return await getAdminData(res);
      }

      return res.status(400).json({ success: false });
    }

    if (req.method === "POST") {
      const action = req.body?.action;

      // Public action
      if (action === "submit-review") {
        return await submitReview(req, res);
      }

      // All remaining actions require Admin session
      if (!requireAdmin(req, res)) return;

      if (action === "save-content") {
        return await saveContent(req, res);
      }

      if (action === "save-feature") {
        return await saveListItem(req, res, TABLES.features, [
          "icon", "title", "description", "sort_order", "is_active"
        ]);
      }

      if (action === "delete-feature") {
        return await deleteListItem(req, res, TABLES.features);
      }

      if (action === "save-faq") {
        return await saveListItem(req, res, TABLES.faqs, [
          "question", "answer", "sort_order", "is_active"
        ]);
      }

      if (action === "delete-faq") {
        return await deleteListItem(req, res, TABLES.faqs);
      }

      if (action === "moderate-review") {
        return await moderateReview(req, res);
      }

      if (action === "delete-review") {
        return await deleteReview(req, res);
      }

      return res.status(400).json({
        success: false,
        message: "Unknown action"
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });

  } catch (error) {
    return sendError(res, error);
  }
};
