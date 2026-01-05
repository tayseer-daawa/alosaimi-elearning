// Create query key factories HERE shared across features.

export const queryKeys = {
  example: {
    all: ["example"] as const, // key for all examples
    lists() {
      return [...this.all, "list"] as const
    }, // e.g., ['example','list']
    detail(id: string | number) {
      return [...this.all, "detail", String(id)] as const
    }, // e.g., ['example','detail','1']
  },
  // other features:
  // todos: { all: ['todos'], lists() {...}, detail(id) {...} }
}
