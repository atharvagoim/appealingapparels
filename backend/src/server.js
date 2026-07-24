import app from "./app.js";
import config, { assertConfig } from "./config/env.js";
import { connectDB } from "./config/db.js";
import SupportThread from "./models/SupportThread.js";
import { describeMailTransport } from "./utils/mailer.js";

assertConfig();

connectDB().then(async () => {
  // Support used to be capped at one thread per customer; clear that constraint
  // so several conversations can run side by side.
  await SupportThread.dropLegacyUniqueIndex();

  console.log(`✓ Mail transport: ${describeMailTransport()}`);

  app.listen(config.port, () => {
    console.log(
      `✓ API running on http://localhost:${config.port} (${config.nodeEnv})`
    );
  });
});
