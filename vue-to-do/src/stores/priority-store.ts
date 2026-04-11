import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/client'
import type { TodoPriority, TodoPriorityRequest } from '@/types'

export const usePriorityStore = defineStore('priorities', () => {
  const priorities = ref<TodoPriority[]>([])

  const fetchPriorities = async () => {
    priorities.value = await api.get<TodoPriority[]>('/api/v1/TodoPriorities')
  }

  const addPriority = async (priority: TodoPriorityRequest) => {
    const created = await api.post<TodoPriority>('/api/v1/TodoPriorities', priority)
    priorities.value.push(created)
  }

  const deletePriority = async (id: string) => {
    await api.delete(`/api/v1/TodoPriorities/${id}`)
    priorities.value = priorities.value.filter((p) => p.id !== id)
  }

  return { priorities, fetchPriorities, addPriority, deletePriority }
})
