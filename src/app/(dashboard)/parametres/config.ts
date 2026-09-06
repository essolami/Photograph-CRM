export const sections = {
  packs: {
    title: "Packs",
    description:
      "Créez vos packs et renseignez leurs tarifs solo et binôme par faculté, au même endroit.",
    kind: "pack",
  },
  supplements: {
    title: "Suppléments",
    description:
      "Ces options seront proposées sous forme de cases à cocher lors de l’ajout d’un client. Renseignez leurs prix avant de les activer.",
    kind: "supplement",
  },
  photographes: {
    title: "Photographes",
    description: "Gérez les photographes disponibles pour les prestations.",
    kind: "photographer",
  },
  monteurs: {
    title: "Monteurs",
    description: "Gérez les personnes chargées du montage.",
    kind: "editor",
  },
} as const;
export type Section = keyof typeof sections;
