export const elements = [
  "TOGE COMPLET",
  "TOGE AVEC CHAPEAU PERSO",
  "TOGE AVEC ECHARPE",
  "ECHARPE",
  "ECHARPE AVEC CHAPEAU",
  "ECHARPE AVEC CHAPEAU PERSO",
  "CHAPEAU",
  "CHAPEAU PERSO",
  "TOGE",
] as const;

export const elementPrices: Record<(typeof elements)[number], number> = {
  "TOGE COMPLET": 400,
  "TOGE AVEC CHAPEAU PERSO": 430,
  "TOGE AVEC ECHARPE": 350,
  ECHARPE: 150,
  "ECHARPE AVEC CHAPEAU": 200,
  "ECHARPE AVEC CHAPEAU PERSO": 230,
  CHAPEAU: 50,
  "CHAPEAU PERSO": 80,
  TOGE: 200,
};

export const colors = ["BORDEAUX", "NOIR", "BLEU NUIT", "VERT", "BEIGE", "BLEU ROI"] as const;
export const sizes = ["XS", "S", "M", "L", "XL"] as const;
export const locations = ["CASABLANCA", "HORS CASABLANCA"] as const;

export const togeOptions = { elements, colors, sizes, locations };
