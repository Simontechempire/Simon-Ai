
const express = require("express");
const crypto = require("crypto");

const router = express.Router();

router.use(express.json({ limit: "100kb" }));

router.get("/status", (req, res) => {
  res.json({
    name: "SIMON API",
    version: "1.0.0",
    status: "online"
  });
});

router.post("/verify", (req, res) => {
  const provided = req.headers["x-simon-key"] || "";
  const expected = process.env.SIMON_API_SECRET || "";

  if (!expected) {
    return res.status(503).json({
      error: "API secret not configured"
    });
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({
      error: "Invalid API key"
    });
  }

  res.json({
    success: true,
    message: "SIMON API authentication successful"
  });
});

module.exports = router;
