export interface Note {
  title: string;
  markdown: string;
  timeLastModified: number;
}

export const storedNotes = storage.defineItem<Record<number, Note>>(
  "local:notes",
  {
    defaultValue: {},
  }
);
