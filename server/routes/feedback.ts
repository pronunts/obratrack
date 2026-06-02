import { Router } from "express";
import { db } from "../db.js";
import { feedback } from "../schema.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", async (req, res) => {
  try {
    const { type, content } = req.body;
    
    // In a real app we'd get userId from JWT auth middleware
    // For MVP we just allow anonymous/logged-in feedback
    const newFeedback = await db.insert(feedback).values({
      type,
      content,
      createdAt: new Date(),
    }).returning();

    res.json({ success: true, feedback: newFeedback[0] });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Server error handling feedback" });
  }
});
