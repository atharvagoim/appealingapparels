import SupportThread from "../models/SupportThread.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const MAX_LEN = 2000;

const clean = (body) => {
  const text = String(body || "").trim();
  if (!text) throw new ApiError(400, "Please type a message.");
  if (text.length > MAX_LEN) {
    throw new ApiError(400, `Messages are limited to ${MAX_LEN} characters.`);
  }
  return text;
};

/** Everything the store replied is now seen by the customer. */
async function markReadByUser(thread) {
  let touched = false;
  thread.messages.forEach((m) => {
    if (m.from === "admin" && !m.readByUser) {
      m.readByUser = true;
      touched = true;
    }
  });
  if (touched) await thread.save();
}

/** Trimmed shape for the customer's list of conversations. */
function summarise(t) {
  const last = t.messages[t.messages.length - 1];
  return {
    id: t.id,
    topic: t.topic,
    subject: t.subject,
    orderNumber: t.orderNumber,
    productName: t.productName,
    productImage: t.productImage,
    status: t.status,
    lastMessageAt: t.lastMessageAt,
    createdAt: t.createdAt,
    messageCount: t.messages.length,
    unread: t.messages.filter((m) => m.from === "admin" && !m.readByUser).length,
    lastMessage: last ? { from: last.from, body: last.body } : null,
  };
}

/* ---------------- customer ---------------- */

/** GET /api/support/me/threads — all of the customer's conversations. */
export const listMyThreads = asyncHandler(async (req, res) => {
  const threads = await SupportThread.find({
    user: req.user._id,
    "messages.0": { $exists: true },
  }).sort({ lastMessageAt: -1 });

  res.json(threads.map(summarise));
});

/** GET /api/support/me/threads/:id — one conversation in full. */
export const getMyThreadById = asyncHandler(async (req, res) => {
  const thread = await SupportThread.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!thread) throw new ApiError(404, "Conversation not found.");

  await markReadByUser(thread);
  res.json(thread);
});

/**
 * POST /api/support/me/threads — start a new conversation.
 *
 * Context is optional: a thread can be about an order, a product, or nothing
 * in particular. Asking about the same order twice reuses the open thread so
 * the store isn't left with a pile of near-identical conversations.
 */
export const createMyThread = asyncHandler(async (req, res) => {
  const body = clean(req.body.body);
  const { topic, orderId, orderNumber, productId, productName, productImage } =
    req.body;

  const kind = ["order", "product", "general"].includes(topic) ? topic : "general";

  // Reuse an open thread with the same context rather than spawning duplicates.
  let thread = null;
  if (kind === "order" && orderId) {
    thread = await SupportThread.findOne({
      user: req.user._id,
      order: orderId,
      status: "open",
    });
  } else if (kind === "product" && productId) {
    thread = await SupportThread.findOne({
      user: req.user._id,
      product: productId,
      status: "open",
    });
  }

  if (!thread) {
    const subject =
      kind === "order"
        ? `Order ${orderNumber || ""}`.trim()
        : kind === "product"
        ? productName || "Product enquiry"
        : "General enquiry";

    thread = new SupportThread({
      user: req.user._id,
      topic: kind,
      subject: subject || "General enquiry",
      order: kind === "order" ? orderId || null : null,
      orderNumber: kind === "order" ? orderNumber || "" : "",
      product: kind === "product" ? productId || null : null,
      productName: kind === "product" ? productName || "" : "",
      productImage: kind === "product" ? productImage || "" : "",
      messages: [],
    });
  }

  thread.messages.push({ from: "user", body, readByUser: true, readByAdmin: false });
  thread.lastMessageAt = new Date();
  thread.status = "open";
  await thread.save();

  res.status(201).json(thread);
});

/** POST /api/support/me/threads/:id/messages — reply in a conversation. */
export const postMyMessage = asyncHandler(async (req, res) => {
  const body = clean(req.body.body);

  const thread = await SupportThread.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!thread) throw new ApiError(404, "Conversation not found.");

  thread.messages.push({ from: "user", body, readByUser: true, readByAdmin: false });
  thread.lastMessageAt = new Date();
  thread.status = "open"; // a new question reopens a closed thread
  await thread.save();

  res.status(201).json(thread);
});

/* ---------------- admin ---------------- */

/** GET /api/support — every conversation, newest activity first. */
export const listThreads = asyncHandler(async (_req, res) => {
  // Empty "No messages yet" threads (created when a customer opens support but
  // never writes) are cleaned up automatically so the inbox stays tidy.
  await SupportThread.deleteMany({ messages: { $size: 0 } });

  const threads = await SupportThread.find()
    .populate("user", "name email phone")
    .sort({ lastMessageAt: -1 });

  const summary = threads.map((t) => {
    const unread = t.messages.filter((m) => m.from === "user" && !m.readByAdmin).length;
    const last = t.messages[t.messages.length - 1];
    return {
      id: t.id,
      user: t.user,
      topic: t.topic,
      subject: t.subject,
      orderNumber: t.orderNumber,
      productName: t.productName,
      status: t.status,
      unread,
      lastMessageAt: t.lastMessageAt,
      lastMessage: last ? { from: last.from, body: last.body } : null,
      messageCount: t.messages.length,
    };
  });

  res.json(summary);
});

/** GET /api/support/:id — one conversation (marks the customer's notes read). */
export const getThread = asyncHandler(async (req, res) => {
  const thread = await SupportThread.findById(req.params.id).populate(
    "user",
    "name email phone"
  );
  if (!thread) throw new ApiError(404, "Conversation not found.");

  let touched = false;
  thread.messages.forEach((m) => {
    if (m.from === "user" && !m.readByAdmin) {
      m.readByAdmin = true;
      touched = true;
    }
  });
  if (touched) await thread.save();

  res.json(thread);
});

/** POST /api/support/:id/messages — admin replies. */
export const postAdminMessage = asyncHandler(async (req, res) => {
  const body = clean(req.body.body);

  const thread = await SupportThread.findById(req.params.id);
  if (!thread) throw new ApiError(404, "Conversation not found.");

  thread.messages.push({ from: "admin", body, readByAdmin: true, readByUser: false });
  thread.lastMessageAt = new Date();
  await thread.save();

  const populated = await thread.populate("user", "name email phone");
  res.status(201).json(populated);
});

/** DELETE /api/support/:id — remove a conversation from the inbox for good. */
export const deleteThread = asyncHandler(async (req, res) => {
  const thread = await SupportThread.findById(req.params.id);
  if (!thread) throw new ApiError(404, "Conversation not found.");

  await thread.deleteOne();
  res.json({ id: req.params.id, deleted: true });
});

/** PUT /api/support/:id/status — open / closed. */
export const setThreadStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["open", "closed"].includes(status)) {
    throw new ApiError(400, "Status must be open or closed.");
  }

  const thread = await SupportThread.findById(req.params.id);
  if (!thread) throw new ApiError(404, "Conversation not found.");

  thread.status = status;
  await thread.save();

  res.json({ id: thread.id, status: thread.status });
});
