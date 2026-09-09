export const taskStatuses = ["Pas commencée", "En cours", "Terminée"] as const;
export type TaskStatus = (typeof taskStatuses)[number];
