import app from "./app";
import { connectDb } from "./common/config/db";

const PORT = process.env.PORT ?? 4000;

async function bootstrap() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`[ShipFlow API] Server running on http://localhost:${PORT}`);
      console.log(`[ShipFlow API] Health → http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("[ShipFlow API] Failed to start:", error);
    process.exit(1);
  }
}

bootstrap();
