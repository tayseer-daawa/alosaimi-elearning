// this file ONLY handles REST calls. never UI, never react hooks.

import { BooksService, LessonsService } from "@/client"

export const booksRepo = {
  getOne(bookId: string) {
    return BooksService.readBook({ bookId })
  },
  lessonsByBook(bookId: string, params?: { skip?: number; limit?: number }) {
    return LessonsService.readLessonsByBook({ bookId, ...params })
  },
}

export const lessonsRepo = {
  getOne(lessonId: string) {
    return LessonsService.readLesson({ lessonId })
  },
}
