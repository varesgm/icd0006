import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/client'
import type { TodoTask, TodoTaskRequest } from '@/types'

export const useTodoStore = defineStore('todos', () => {
  const tasks = ref<TodoTask[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTasks = async () => {
    loading.value = true
    error.value = null
    try {
      tasks.value = await api.get<TodoTask[]>('/api/v1/TodoTasks')
    } catch {
      error.value = 'Failed to load tasks.'
    } finally {
      loading.value = false
    }
  }

  const addTask = async (task: TodoTaskRequest) => {
    const created = await api.post<TodoTask>('/api/v1/TodoTasks', task)
    tasks.value.push(created)
  }

  const updateTask = async (id: string, task: TodoTaskRequest) => {
    const updated = await api.put<TodoTask>(`/api/v1/TodoTasks/${id}`, task)
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) tasks.value[index] = updated
  }

  const deleteTask = async (id: string) => {
    await api.delete(`/api/v1/TodoTasks/${id}`)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  return { tasks, loading, error, fetchTasks, addTask, updateTask, deleteTask }
})
