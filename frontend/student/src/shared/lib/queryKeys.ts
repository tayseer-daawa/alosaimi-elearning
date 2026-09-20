// Create query key factories HERE shared across features.

export const queryKeys = {
  example: {
    all: ["example"] as const,
    lists() {
      return [...this.all, "list"] as const
    },
    detail(id: string | number) {
      return [...this.all, "detail", String(id)] as const
    },
  },
  programs: {
    all: ["programs"] as const,
    lists() {
      return [...this.all, "list"] as const
    },
    detail(id: string) {
      return [...this.all, "detail", id] as const
    },
  },
  phases: {
    all: ["phases"] as const,
    byProgram(programId: string) {
      return [...this.all, "program", programId] as const
    },
    detail(id: string) {
      return [...this.all, "detail", id] as const
    },
    books(phaseId: string) {
      return [...this.all, "books", phaseId] as const
    },
  },
  books: {
    all: ["books"] as const,
    detail(id: string) {
      return [...this.all, "detail", id] as const
    },
    lessons(bookId: string) {
      return [...this.all, "lessons", bookId] as const
    },
  },
  lessons: {
    all: ["lessons"] as const,
    detail(id: string) {
      return [...this.all, "detail", id] as const
    },
  },
  users: {
    all: ["users"] as const,
    me() {
      return [...this.all, "me"] as const
    },
  },
}
