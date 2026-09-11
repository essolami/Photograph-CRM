import PDFDocument from "pdfkit";
import path from "node:path";
import {
  cents,
  formatDh,
  remainingPrice,
  type SupplementChoice,
} from "./client-data";

export type ClientQuote = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  defenseDate: Date | null;
  defenseTime: string | null;
  facultyName: string | null;
  packName: string | null;
  isDuo: boolean;
  basePrice: string;
  supplements: SupplementChoice[];
  discount: string;
  total: string;
  advance: string;
};

export async function createClientQuote(client: ClientQuote) {
  const doc = new PDFDocument({ size: "A4", margin: 44, bufferPages: true });
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.info.Title = `Devis - ${client.name}`;
  doc.info.Author = "Graduation";
  const ink = "#182329",
    muted = "#68777c",
    teal = "#176b65",
    line = "#dce5e3";
  const left = 44,
    width = 507;
  const reference = String(client.id).padStart(5, "0");
  const money = (value: string) =>
    formatDh(value).replace(/[\u202f\u00a0]/g, " ");
  const write = (
    value: string,
    x: number,
    y: number,
    w: number,
    size = 10,
    bold = false,
    color = ink,
    align: "left" | "right" = "left",
  ) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size)
      .fillColor(color)
      .text(value, x, y, { width: w, align });
    return doc.y;
  };
  const header = (continued = false) => {
    doc.rect(0, 0, 595.28, 7).fill(teal);
    doc.save().circle(left + 38, 68, 38).clip();
    doc.image(
      path.join(process.cwd(), "public", "Graduation-logo.png"),
      left,
      30,
      { width: 76 },
    );
    doc.restore();
    write("GRADUATION", 133, 46, 220, 19, true);
    write("PHOTOGRAPHIE DE SOUTENANCE", 134, 73, 230, 8, false, muted);
    write("DEVIS", 390, 39, 161, 28, true, teal, "right");
    write(
      `Dossier N° ${reference}${continued ? " · Suite" : ""}`,
      370,
      76,
      181,
      9,
      false,
      muted,
      "right",
    );
    doc
      .moveTo(left, 123)
      .lineTo(551, 123)
      .lineWidth(0.7)
      .strokeColor(line)
      .stroke();
  };
  header();
  write("VOTRE COMMANDE", left, 144, 260, 10, true, teal);
  write(
    `Émis le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca" }).format(new Date())}`,
    340,
    144,
    211,
    9,
    false,
    muted,
    "right",
  );

  const clientLines = [
    client.name,
    client.phone ? `Téléphone : ${client.phone}` : "",
    client.email || "",
  ].filter(Boolean);
  const defenseLines = [
    client.defenseDate
      ? new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "long",
          timeZone: "UTC",
        }).format(client.defenseDate)
      : "Date à confirmer",
    `Heure : ${client.defenseTime || "À confirmer"}`,
    `Faculté : ${client.facultyName || "À confirmer"}`,
    `Formule : ${client.isDuo ? "Binôme" : "Solo"}`,
  ];
  const cardHeight = (values: string[]) =>
    42 +
    values.reduce((height, value, i) => {
      doc
        .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(i === 0 ? 12 : 10);
      return height + doc.heightOfString(value, { width: 209 }) + 7;
    }, 0);
  const height = Math.max(cardHeight(clientLines), cardHeight(defenseLines));
  const card = (title: string, values: string[], x: number) => {
    doc.roundedRect(x, 169, 245, height, 8).fill("#f2f6f5");
    write(title, x + 18, 186, 209, 8, true, teal);
    let top = 208;
    for (const [i, value] of values.entries())
      top = write(value, x + 18, top, 209, i === 0 ? 12 : 10, i === 0) + 7;
  };
  card("PRÉPARÉ POUR", clientLines, left);
  card("SOUTENANCE", defenseLines, 306);
  let y = 169 + height + 29;
  const tableHeader = () => {
    doc.roundedRect(left, y, width, 30, 4).fill(ink);
    write("PRESTATION / DÉSIGNATION", 58, y + 10, 340, 8, true, "#ffffff");
    write("MONTANT", 418, y + 10, 119, 8, true, "#ffffff", "right");
    y += 30;
  };
  tableHeader();
  const nextPage = () => {
    doc.addPage();
    header(true);
    y = 144;
  };
  const items = [
    {
      name: `Pack : ${client.packName || "À confirmer"}`,
      price: client.basePrice,
    },
    ...client.supplements.map((item) => ({
      name: `Supplément : ${item.name}`,
      price: item.price,
    })),
  ];
  for (const [index, item] of items.entries()) {
    doc.font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    const rowHeight = Math.max(
      39,
      doc.heightOfString(item.name, { width: 340 }) + 24,
    );
    if (y + rowHeight > 721) {
      nextPage();
      tableHeader();
    }
    if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill("#f7f9f8");
    const bottom = write(item.name, 58, y + 13, 340, 10, index === 0);
    write(
      money(item.price),
      411,
      bottom - 12,
      126,
      10,
      index === 0,
      ink,
      "right",
    );
    y = Math.max(y + rowHeight, doc.y + 12);
    doc.moveTo(left, y).lineTo(551, y).strokeColor(line).stroke();
  }
  if (!client.supplements.length) {
    y += 10;
    y = write("Aucun supplément", 58, y, 340, 9, false, muted) + 8;
  }
  const hasDiscount = cents(client.discount) > 0;
  const summaryHeight = hasDiscount ? 157 : 130;
  if (y + summaryHeight + 86 > 735) nextPage();
  y += 24;
  write("RÉCAPITULATIF", left, y + 4, 210, 10, true, teal);
  write(
    "Montants exprimés en dirhams (DH).",
    left,
    y + 24,
    215,
    9,
    false,
    muted,
  );
  doc.roundedRect(306, y, 245, summaryHeight, 8).fill("#f2f6f5");
  let paymentY = y + 17;
  const payment = (label: string, value: string, bold = false) => {
    write(label, 322, paymentY, 111, 10, bold);
    write(money(value), 433, paymentY, 102, 10, bold, ink, "right");
    paymentY += 27;
  };
  if (hasDiscount) payment("Réduction", client.discount);
  payment("Total à payer", client.total, true);
  payment("Avance versée", client.advance);
  doc.roundedRect(306, paymentY + 2, 245, 44, 6).fill(teal);
  write("Reste à payer", 322, paymentY + 18, 110, 10, true, "#ffffff");
  write(
    money(remainingPrice(client.total, client.advance)),
    422,
    paymentY + 16,
    113,
    13,
    true,
    "#ffffff",
    "right",
  );
  y += summaryHeight + 30;
  write("Merci pour votre confiance !", left, y, width, 13, true);
  write(
    "Vos souvenirs de soutenance, notre passion.",
    left,
    y + 21,
    width,
    9,
    false,
    muted,
  );
  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index++) {
    doc.switchToPage(index);
    doc.moveTo(left, 772).lineTo(551, 772).strokeColor(line).stroke();
    write(
      `GRADUATION  /  Devis · Dossier ${reference}`,
      left,
      786,
      400,
      8,
      false,
      muted,
    );
    write(
      `${index + 1} / ${pages.count}`,
      481,
      786,
      70,
      8,
      false,
      muted,
      "right",
    );
  }
  doc.end();
  return finished;
}
