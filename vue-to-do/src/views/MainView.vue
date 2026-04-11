<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTodoStore } from '@/stores/todo-store'
import { useCategoryStore } from '@/stores/category-store'
import { usePriorityStore } from '@/stores/priority-store'
import type { TodoTask, TodoTaskRequest } from '@/types'

const todoStore = useTodoStore()
const categoryStore = useCategoryStore()
const priorityStore = usePriorityStore()

// storeToRefs preserves reactivity when destructuring store state
const { tasks, loading, error } = storeToRefs(todoStore)
const { categories } = storeToRefs(categoryStore)
const { priorities } = storeToRefs(priorityStore)

const activeTab = ref<'active' | 'done' | 'archived' | 'categories' | 'priorities'>('active')
const actionError = ref('')

// Task form
const taskForm = ref({ taskName: '', dueDt: '', todoCategoryId: '', todoPriorityId: '' })
const taskError = ref('')
const taskLoading = ref(false)

// Category form
const categoryForm = ref({ categoryName: '', tag: '' })
const categoryError = ref('')
const categoryLoading = ref(false)

// Priority form
const priorityForm = ref({ priorityName: '' })
const priorityError = ref('')
const priorityLoading = ref(false)

onMounted(async () => {
  await Promise.all([
    todoStore.fetchTasks(),
    categoryStore.fetchCategories(),
    priorityStore.fetchPriorities(),
  ])
})

const activeTasks = computed(() => tasks.value.filter((t) => !t.isCompleted && !t.isArchived))
const doneTasks = computed(() => tasks.value.filter((t) => t.isCompleted && !t.isArchived))
const archivedTasks = computed(() => tasks.value.filter((t) => t.isArchived))

const getCategoryName = (id: string) =>
  categories.value.find((c) => c.id === id)?.categoryName ?? null

const getPriorityName = (id: string) =>
  priorities.value.find((p) => p.id === id)?.priorityName ?? null

const formatDate = (dt: string | null) => {
  if (!dt) return null
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const isOverdue = (dueDt: string | null, isCompleted: boolean) => {
  if (!dueDt || isCompleted) return false
  return new Date(dueDt) < new Date()
}

const buildTaskRequest = (task: TodoTask, overrides: Partial<TodoTaskRequest>): TodoTaskRequest => ({
  id: task.id,
  taskName: task.taskName ?? '',
  taskSort: task.taskSort,
  createdDt: task.createdDt,
  dueDt: task.dueDt,
  isCompleted: task.isCompleted,
  isArchived: task.isArchived,
  todoCategoryId: task.todoCategoryId || null,
  todoPriorityId: task.todoPriorityId || null,
  syncDt: task.syncDt,
  ...overrides,
})

const addTask = async () => {
  if (!taskForm.value.taskName.trim()) return
  taskError.value = ''
  taskLoading.value = true
  try {
    const request: TodoTaskRequest = {
      taskName: taskForm.value.taskName.trim(),
      taskSort: tasks.value.length,
      createdDt: new Date().toISOString(),
      dueDt: taskForm.value.dueDt ? new Date(taskForm.value.dueDt).toISOString() : null,
      isCompleted: false,
      isArchived: false,
      todoCategoryId: taskForm.value.todoCategoryId || null,
      todoPriorityId: taskForm.value.todoPriorityId || null,
    }
    await todoStore.addTask(request)
    taskForm.value = { taskName: '', dueDt: '', todoCategoryId: '', todoPriorityId: '' }
  } catch {
    taskError.value = 'Failed to add task.'
  } finally {
    taskLoading.value = false
  }
}

const markDone = async (task: TodoTask) => {
  actionError.value = ''
  try {
    await todoStore.updateTask(task.id, buildTaskRequest(task, { isCompleted: true }))
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Failed to mark task as done.'
  }
}

const undoDone = async (task: TodoTask) => {
  actionError.value = ''
  try {
    await todoStore.updateTask(task.id, buildTaskRequest(task, { isCompleted: false }))
  } catch {
    actionError.value = 'Failed to reopen task.'
  }
}

const archiveTask = async (task: TodoTask) => {
  actionError.value = ''
  try {
    await todoStore.updateTask(task.id, buildTaskRequest(task, { isArchived: true }))
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Failed to archive task.'
  }
}

const unarchiveTask = async (task: TodoTask) => {
  actionError.value = ''
  try {
    await todoStore.updateTask(task.id, buildTaskRequest(task, { isArchived: false }))
  } catch {
    actionError.value = 'Failed to unarchive task.'
  }
}

const deleteTask = async (id: string) => {
  actionError.value = ''
  try {
    await todoStore.deleteTask(id)
  } catch {
    actionError.value = 'Failed to delete task.'
  }
}

const addCategory = async () => {
  if (!categoryForm.value.categoryName.trim()) return
  categoryError.value = ''
  categoryLoading.value = true
  try {
    await categoryStore.addCategory({
      categoryName: categoryForm.value.categoryName.trim(),
      categorySort: categories.value.length,
      tag: categoryForm.value.tag.trim() || null,
    })
    categoryForm.value = { categoryName: '', tag: '' }
  } catch {
    categoryError.value = 'Failed to add category.'
  } finally {
    categoryLoading.value = false
  }
}

const deleteCategory = async (id: string) => {
  await categoryStore.deleteCategory(id)
}

const addPriority = async () => {
  if (!priorityForm.value.priorityName.trim()) return
  priorityError.value = ''
  priorityLoading.value = true
  try {
    await priorityStore.addPriority({
      priorityName: priorityForm.value.priorityName.trim(),
      prioritySort: priorities.value.length,
    })
    priorityForm.value = { priorityName: '' }
  } catch {
    priorityError.value = 'Failed to add priority.'
  } finally {
    priorityLoading.value = false
  }
}

const deletePriority = async (id: string) => {
  await priorityStore.deletePriority(id)
}
</script>

<template>
  <div class="main-view">
    <!-- Page header -->
    <div class="page-header d-flex justify-content-between align-items-end mb-4">
      <div>
        <h1 class="page-title mb-0">My Tasks</h1>
        <p class="page-subtitle mb-0">{{ doneTasks.length }} / {{ activeTasks.length + doneTasks.length }} completed</p>
      </div>
    </div>

    <div v-if="actionError" class="alert alert-danger mb-3 py-2">{{ actionError }}</div>

    <!-- Tab navigation -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'active' }" @click="activeTab = 'active'">
          Active
          <span class="badge ms-1">{{ activeTasks.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'done' }" @click="activeTab = 'done'">
          Done
          <span class="badge ms-1">{{ doneTasks.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'archived' }" @click="activeTab = 'archived'">
          Archived
          <span class="badge ms-1">{{ archivedTasks.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">
          Categories
          <span class="badge ms-1">{{ categories.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'priorities' }" @click="activeTab = 'priorities'">
          Priorities
          <span class="badge ms-1">{{ priorities.length }}</span>
        </button>
      </li>
    </ul>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading…</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <template v-else>

      <!-- ===== ACTIVE TAB ===== -->
      <div v-if="activeTab === 'active'">
        <div class="mb-4">
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="task-item"
          >
            <div class="task-info flex-grow-1">
              <span class="task-name">{{ task.taskName }}</span>
              <div class="d-flex gap-2 flex-wrap mt-1">
                <span
                  v-if="task.dueDt"
                  class="badge-meta"
                  :class="{ 'text-danger': isOverdue(task.dueDt, task.isCompleted) }"
                >
                  📅 {{ formatDate(task.dueDt) }}
                  <span v-if="isOverdue(task.dueDt, task.isCompleted)"> · overdue</span>
                </span>
                <span v-if="getCategoryName(task.todoCategoryId)" class="badge-category">
                  {{ getCategoryName(task.todoCategoryId) }}
                </span>
                <span v-if="getPriorityName(task.todoPriorityId)" class="badge-priority">
                  {{ getPriorityName(task.todoPriorityId) }}
                </span>
              </div>
            </div>
            <div class="task-actions d-flex gap-1">
              <button class="btn btn-sm btn-outline-primary" title="Mark as done" @click="markDone(task)">✓ Done</button>
              <button class="btn btn-sm btn-outline-secondary" title="Archive" @click="archiveTask(task)">📦</button>
              <button class="btn btn-sm btn-outline-danger" title="Delete" @click="deleteTask(task.id)">🗑</button>
            </div>
          </div>
          <div v-if="activeTasks.length === 0" class="empty-state">No active tasks — add one below!</div>
        </div>

        <!-- Add task form -->
        <div class="card">
          <div class="card-header">Add Task</div>
          <div class="card-body">
            <form @submit.prevent="addTask">
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Task Name *</label>
                  <input
                    v-model="taskForm.taskName"
                    type="text"
                    class="form-control"
                    placeholder="What needs to be done?"
                    required
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Due Date</label>
                  <input v-model="taskForm.dueDt" type="date" class="form-control" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Category</label>
                  <select v-model="taskForm.todoCategoryId" class="form-select">
                    <option value="">— None —</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.categoryName }}
                    </option>
                  </select>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Priority</label>
                  <select v-model="taskForm.todoPriorityId" class="form-select">
                    <option value="">— None —</option>
                    <option v-for="pri in priorities" :key="pri.id" :value="pri.id">
                      {{ pri.priorityName }}
                    </option>
                  </select>
                </div>
              </div>
              <div v-if="taskError" class="alert alert-danger mt-3 py-2">{{ taskError }}</div>
              <button type="submit" class="btn btn-primary mt-3" :disabled="taskLoading">
                {{ taskLoading ? 'Adding…' : '+ Add Task' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- ===== DONE TAB ===== -->
      <div v-if="activeTab === 'done'">
        <div class="mb-4">
          <div
            v-for="task in doneTasks"
            :key="task.id"
            class="task-item completed"
          >
            <div class="task-info flex-grow-1">
              <span class="task-name">{{ task.taskName }}</span>
              <div class="d-flex gap-2 flex-wrap mt-1">
                <span v-if="task.dueDt" class="badge-meta">📅 {{ formatDate(task.dueDt) }}</span>
                <span v-if="getCategoryName(task.todoCategoryId)" class="badge-category">
                  {{ getCategoryName(task.todoCategoryId) }}
                </span>
                <span v-if="getPriorityName(task.todoPriorityId)" class="badge-priority">
                  {{ getPriorityName(task.todoPriorityId) }}
                </span>
              </div>
            </div>
            <div class="task-actions d-flex gap-1">
              <button class="btn btn-sm btn-outline-secondary" title="Reopen" @click="undoDone(task)">↩ Reopen</button>
              <button class="btn btn-sm btn-outline-secondary" title="Archive" @click="archiveTask(task)">📦</button>
              <button class="btn btn-sm btn-outline-danger" title="Delete" @click="deleteTask(task.id)">🗑</button>
            </div>
          </div>
          <div v-if="doneTasks.length === 0" class="empty-state">No completed tasks yet.</div>
        </div>
      </div>

      <!-- ===== ARCHIVED TAB ===== -->
      <div v-if="activeTab === 'archived'">
        <div class="mb-4">
          <div
            v-for="task in archivedTasks"
            :key="task.id"
            class="task-item archived"
          >
            <div class="task-info flex-grow-1">
              <span class="task-name">{{ task.taskName }}</span>
              <div class="d-flex gap-2 flex-wrap mt-1">
                <span v-if="task.isCompleted" class="badge-meta" style="color: #5a5;">✓ Completed</span>
                <span v-if="task.dueDt" class="badge-meta">📅 {{ formatDate(task.dueDt) }}</span>
                <span v-if="getCategoryName(task.todoCategoryId)" class="badge-category">
                  {{ getCategoryName(task.todoCategoryId) }}
                </span>
              </div>
            </div>
            <div class="task-actions d-flex gap-1">
              <button class="btn btn-sm btn-outline-secondary" title="Unarchive" @click="unarchiveTask(task)">📤 Restore</button>
              <button class="btn btn-sm btn-outline-danger" title="Delete permanently" @click="deleteTask(task.id)">🗑</button>
            </div>
          </div>
          <div v-if="archivedTasks.length === 0" class="empty-state">No archived tasks.</div>
        </div>
      </div>

      <!-- ===== CATEGORIES TAB ===== -->
      <div v-if="activeTab === 'categories'">
        <div class="table-responsive mb-4">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tag</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categories" :key="cat.id">
                <td style="color: var(--text);">{{ cat.categoryName }}</td>
                <td>
                  <span v-if="cat.tag" class="badge-category">{{ cat.tag }}</span>
                  <span v-else style="color: #555;">—</span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-danger" @click="deleteCategory(cat.id)">Delete</button>
                </td>
              </tr>
              <tr v-if="categories.length === 0">
                <td colspan="3" class="text-center py-4">
                  <div class="empty-state">No categories yet.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-header">Add Category</div>
          <div class="card-body">
            <form @submit.prevent="addCategory">
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Category Name *</label>
                  <input
                    v-model="categoryForm.categoryName"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Work"
                    required
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Tag</label>
                  <input v-model="categoryForm.tag" type="text" class="form-control" placeholder="e.g. work" />
                </div>
              </div>
              <div v-if="categoryError" class="alert alert-danger mt-3 py-2">{{ categoryError }}</div>
              <button type="submit" class="btn btn-primary mt-3" :disabled="categoryLoading">
                {{ categoryLoading ? 'Adding…' : '+ Add Category' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- ===== PRIORITIES TAB ===== -->
      <div v-if="activeTab === 'priorities'">
        <div class="table-responsive mb-4">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pri in priorities" :key="pri.id">
                <td><span class="badge-priority">{{ pri.priorityName }}</span></td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-danger" @click="deletePriority(pri.id)">Delete</button>
                </td>
              </tr>
              <tr v-if="priorities.length === 0">
                <td colspan="2" class="text-center py-4">
                  <div class="empty-state">No priorities yet.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-header">Add Priority</div>
          <div class="card-body">
            <form @submit.prevent="addPriority">
              <div class="col-12 col-md-6">
                <label class="form-label">Priority Name *</label>
                <input
                  v-model="priorityForm.priorityName"
                  type="text"
                  class="form-control"
                  placeholder="e.g. High"
                  required
                />
              </div>
              <div v-if="priorityError" class="alert alert-danger mt-3 py-2">{{ priorityError }}</div>
              <button type="submit" class="btn btn-primary mt-3" :disabled="priorityLoading">
                {{ priorityLoading ? 'Adding…' : '+ Add Priority' }}
              </button>
            </form>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
