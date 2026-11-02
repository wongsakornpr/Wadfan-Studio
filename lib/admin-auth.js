const crypto = require("crypto");

const COOKIE_NAME = "wadfan_admin_session";
const SESSION_DURATION = 8 * 60 * 60; // 8 ชั่วโมง

function sign(value) {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(value)
    .digest("base64url");
}

function createSession() {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function verifySession(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map(v => v.trim())
    .find(v => v.startsWith(`${COOKIE_NAME}=`));

  if (!cookie || !process.env.SESSION_SECRET) return false;

  const token = cookie.substring(COOKIE_NAME.length + 1);
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    return data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function sessionCookie(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

module.exports = {
  createSession,
  verifySession,
  sessionCookie,
  SESSION_DURATION
};