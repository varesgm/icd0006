import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/client'
import type { TodoCategory, TodoCategoryRequest } from '@/types'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<TodoCategory[]>([])

  const fetchCategories = async () => {
    categories.value = await api.get<TodoCategory[]>('/api/v1/TodoCategories')
  }

  const addCategory = async (category: TodoCategoryRequest) => {
    const created = await api.post<TodoCategory>('/api/v1/TodoCategories', category)
    categories.value.push(created)
  }

  const deleteCategory = async (id: string) => {
    await api.delete(`/api/v1/TodoCategories/${id}`)
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  return { categories, fetchCategories, addCategory, deleteCategory }
})
