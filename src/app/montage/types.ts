export type MontageTask = {
  id: number; title: string; description: string | null; status: string;
  dueDate: string | null; editorId: number; editorName: string; editorPhone: string | null;
  clientId: number | null; clientName: string | null;
};
