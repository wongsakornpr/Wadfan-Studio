const { verifySession } = require("../lib/admin-auth");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: verifySession(req)
  });
};