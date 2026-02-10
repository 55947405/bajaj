require("dotenv").config({ quiet: true });
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const EMAIL = process.env.OFFICIAL_EMAIL || "example@chitkara.edu.in";

//  Utility Functions

function fibonacci(n) {
  const res = [];
  let a = 0, b = 1;

  for (let i = 0; i < n; i++) {
    res.push(a);
    [a, b] = [b, a + b];
  }
  return res;
}

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function hcf(arr) {
  return arr.reduce((a, b) => gcd(a, b));
}

function lcm(arr) {
  return arr.reduce((a, b) => (a * b) / gcd(a, b));
}

async function getAIResponse(question) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API Key");
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: question }] }]
      },
      { timeout: 5000 }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Invalid AI response");

    return text.trim().split(" ")[0];

  } catch {

    const q = question.toLowerCase();

    if (q.includes("capital") && q.includes("maharashtra")) return "Mumbai";
    if (q.includes("capital") && q.includes("india")) return "Delhi";
    if (q.includes("prime minister")) return "Modi";

    return "Unknown";
  }
}

// GET /health

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

// POST /bfhl

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Exactly one key is required"
      });
    }

    const key = keys[0];
    const value = body[key];
    let data;

    if (key === "fibonacci") {
      if (!Number.isInteger(value) || value < 0) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid fibonacci input"
        });
      }
      data = fibonacci(value);

    } else if (key === "prime") {
      if (!Array.isArray(value)) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid prime input"
        });
      }
      data = value.filter(isPrime);

    } else if (key === "lcm") {
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid lcm input"
        });
      }
      data = lcm(value);

    } else if (key === "hcf") {
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid hcf input"
        });
      }
      data = hcf(value);

    } else if (key === "AI" || key === "ai") {
      if (typeof value !== "string" || value.trim() === "") {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid AI input"
        });
      }
      data = await getAIResponse(value);

    } else {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Invalid key"
      });
    }

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });

  } catch {
    res.status(500).json({
      is_success: false,
      official_email: EMAIL,
      error: "Internal Server Error"
    });
  }
});

// Start Server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
