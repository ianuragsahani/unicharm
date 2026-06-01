import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { customersRouter } from "./routes/customers.js";
import { segmentsRouter } from "./routes/segments.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { journeysRouter } from "./routes/journeys.js";
import { whatsappRouter } from "./routes/whatsapp.js";
import { aiRouter } from "./routes/ai.js";
import { loyaltyRouter } from "./routes/loyalty.js";
import { adminRouter } from "./routes/admin.js";
import { crossSellRouter } from "./routes/crosssell.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { analyticsRouter } from "./routes/analytics.js";
import { startJourneyScheduler } from "./services/journey-engine.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Public
app.use("/auth", authRouter);

// Protected — everything below requires a valid JWT
app.use(authMiddleware);
app.use("/dashboard", dashboardRouter);
app.use("/customers", customersRouter);
app.use("/segments", segmentsRouter);
app.use("/campaigns", campaignsRouter);
app.use("/journeys", journeysRouter);
app.use("/whatsapp", whatsappRouter);
app.use("/ai", aiRouter);
app.use("/loyalty", loyaltyRouter);
app.use("/admin", adminRouter);
app.use("/cross-sell", crossSellRouter);
app.use("/analytics", analyticsRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API on http://localhost:${PORT}`);
  startJourneyScheduler();
});
