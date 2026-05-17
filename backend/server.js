import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("Groq Key:", process.env.GROQ_API_KEY ? "Found" : "Missing");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    console.log("User Question:", question);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const answer =
      completion.choices[0]?.message?.content || "No response";

    console.log("Groq Answer:", answer);

    res.json({
      answer,
    });

  } catch (error) {
    console.error("Groq Error:", error);

    res.status(500).json({
      error: "Groq API failed",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
