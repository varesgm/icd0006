export interface JWTResponse {
  token: string
  refreshToken: string
  firstName: string
  lastName: string
}

export interface TodoTask {
  id: string
  taskName: string | null
  taskSort: number
  createdDt: string
  dueDt: string | null
  isCompleted: boolean
  isArchived: boolean
  todoCategoryId: string
  todoPriorityId: string
  syncDt: string
}

export interface TodoTaskRequest {
  id?: string
  taskName: string
  taskSort: number
  createdDt: string
  dueDt: string | null
  isCompleted: boolean
  isArchived: boolean
  todoCategoryId: string | null
  todoPriorityId: string | null
  syncDt?: string
}

export interface TodoCategory {
  id: string
  categoryName: string | null
  categorySort: number
  syncDt: string
  tag: string | null
}

export interface TodoCategoryRequest {
  categoryName: string
  categorySort: number
  tag: string | null
}

export interface TodoPriority {
  id: string
  priorityName: string | null
  prioritySort: number
  syncDt: string
}

export interface TodoPriorityRequest {
  priorityName: string
  prioritySort: number
}
