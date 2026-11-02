const { sessionCookie } = require("../lib/admin-auth");

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  res.setHeader("Set-Cookie", sessionCookie("", 0));
  return res.status(200).json({ success: true });
};