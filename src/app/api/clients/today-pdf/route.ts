import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const money = (value: string) =>
  `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(Number(value))} DH`;
const dateValue = () => new Date().toISOString().slice(0, 10);
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const shortDate = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.canManageUsers)
    return new Response("Non autorisé", { status: 403 });
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || dateValue();
  const to = url.searchParams.get("to") || from;
  if (!validDate(from) || !validDate(to) || to < from)
    return new Response("Période invalide", { status: 400 });
  const clients = await prisma.client.findMany({
    where: {
      defenseDate: {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T00:00:00.000Z`),
      },
    },
    include: { photographer: true },
    orderBy: [{ defenseDate: "asc" }, { name: "asc" }],
  });
  const document = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 28,
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve) =>
    document.on("end", () => resolve(Buffer.concat(chunks))),
  );
  const columns = [120, 105, 82, 155, 85, 145, 93];
  const headers = [
    "Nom prénom",
    "Date",
    "Pack",
    "Suppléments",
    "Faculté",
    "Paiement",
    "Photographe",
  ];
  const rowHeight = 72;
  let y = 28;
  document
    .fillColor("#172554")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(from === to ? `Soutenances du ${shortDate(from)}` : `Soutenances du ${shortDate(from)} au ${shortDate(to)}`, 28, y);
  document
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text(
      `${clients.length} soutenance${clients.length > 1 ? "s" : ""}`,
      28,
      y + 25,
    );
  y += 48;
  const drawCell = (
    x: number,
    top: number,
    w: number,
    h: number,
    text: string,
    header = false,
  ) => {
    document
      .rect(x, top, w, h)
      .fillAndStroke(
        header ? "#dbeafe" : "#ffffff",
        header ? "#93c5fd" : "#cbd5e1",
      );
    document
      .fillColor(header ? "#1e3a8a" : "#172033")
      .font(header ? "Helvetica-Bold" : "Helvetica")
      .fontSize(header ? 8 : 8)
      .text(text || "—", x + 5, top + (header ? 9 : 7), {
        width: w - 10,
        height: h - 12,
        ellipsis: true,
      });
  };
  let x = 28;
  headers.forEach((header, index) => {
    drawCell(x, y, columns[index], 28, header, true);
    x += columns[index];
  });
  y += 28;
  for (const client of clients) {
    if (y + rowHeight > 560) {
      document.addPage();
      y = 28;
      x = 28;
      headers.forEach((header, index) => {
        drawCell(x, y, columns[index], 28, header, true);
        x += columns[index];
      });
      y += 28;
    }
    const supplements = Array.isArray(client.supplements)
      ? (client.supplements as { name: string }[])
          .map((item) => item.name)
          .join(", ")
      : "";
    const total = client.total.toString(),
      advance = client.advance.toString();
    const payment = `Total: ${money(total)}\nAvance: ${money(advance)}\nReste: ${money((Number(total) - Number(advance)).toFixed(2))}`;
    const values = [
      client.name,
      client.defenseDate ? shortDate(client.defenseDate.toISOString().slice(0, 10)) : "",
      client.packName ?? "",
      supplements,
      client.facultyName ?? "",
      payment,
      client.photographer?.name ?? "",
    ];
    x = 28;
    values.forEach((value, index) => {
      drawCell(x, y, columns[index], rowHeight, value);
      x += columns[index];
    });
    y += rowHeight;
  }
  if (!clients.length)
    document
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(11)
      .text(from === to ? "Aucune soutenance prévue à cette date." : "Aucune soutenance prévue pendant cette période.", 33, y + 18);
  document.end();
  const pdf = await finished;
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="soutenances-${from}${from === to ? "" : `-au-${to}`}.pdf"`,
      "Content-Length": String(pdf.length),
    },
  });
}
