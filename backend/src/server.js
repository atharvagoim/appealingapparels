import app from "./app.js";
import config, { assertConfig } from "./config/env.js";
import { connectDB } from "./config/db.js";

assertConfig();

connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(
      `✓ API running on http://localhost:${config.port} (${config.nodeEnv})`
    );
  });
});
