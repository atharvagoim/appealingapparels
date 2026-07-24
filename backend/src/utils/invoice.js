import PDFDocument from "pdfkit";

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Streams a PDF invoice for a paid order into `res`.
 * Kept dependency-light: plain text layout, no external assets.
 */
export function streamInvoice(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const addr = order.shippingAddress || {};
  const amounts = order.amounts || {};

  // Header
  doc.fontSize(20).text("APPEALING APPARELS", { align: "left" });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#666").text("Tax Invoice");
  doc.fillColor("#000");

  doc.moveDown(1);
  doc
    .fontSize(11)
    .text(`Invoice no: ${order.orderNumber || order.id}`)
    .text(`Order date: ${fmtDate(order.createdAt)}`)
    .text(`Payment: ${order.payment?.razorpayPaymentId || "—"}`);

  // Bill to
  doc.moveDown(1);
  doc.fontSize(12).text("Bill to", { underline: false });
  doc.fontSize(11).fillColor("#333");
  doc.text(addr.fullName || "");
  if (addr.line1) doc.text(addr.line1);
  const cityLine = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
  if (cityLine) doc.text(cityLine);
  if (addr.phone) doc.text(`Phone: ${addr.phone}`);
  if (addr.email) doc.text(`Email: ${addr.email}`);
  doc.fillColor("#000");

  // Items table
  doc.moveDown(1.2);
  const top = doc.y;
  doc.fontSize(11).text("Item", 50, top);
  doc.text("Code", 215, top);
  doc.text("Size", 280, top);
  doc.text("Qty", 330, top);
  doc.text("Price", 375, top);
  doc.text("Amount", 480, top, { width: 70, align: "right" });

  doc
    .moveTo(50, doc.y + 4)
    .lineTo(550, doc.y + 4)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(0.6);

  (order.items || []).forEach((i) => {
    const y = doc.y;
    doc.fontSize(10).fillColor("#000");
    doc.text(i.name || "", 50, y, { width: 160 });
    doc.text(i.code || "-", 215, y, { width: 60 });
    doc.text(i.size || "-", 280, y);
    doc.text(String(i.quantity), 330, y);
    doc.text(inr(i.price), 375, y);
    doc.text(inr(i.price * i.quantity), 480, y, { width: 70, align: "right" });
    doc.moveDown(0.6);
  });

  doc
    .moveTo(50, doc.y + 4)
    .lineTo(550, doc.y + 4)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(0.8);

  // Totals
  const line = (label, value, bold = false) => {
    const y = doc.y;
    doc.fontSize(bold ? 12 : 11);
    doc.text(label, 360, y);
    doc.text(value, 480, y, { width: 70, align: "right" });
    doc.moveDown(0.5);
  };
  line("Subtotal", inr(amounts.subtotal));
  line("Shipping", amounts.shipping ? inr(amounts.shipping) : "Free");
  line("Total paid", inr(amounts.total), true);

  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor("#777")
    .text(
      "Thank you for shopping with Appealing Apparels. For any query, reach us through the Help section in your account.",
      50,
      doc.y,
      { width: 500 }
    );

  doc.end();
}
