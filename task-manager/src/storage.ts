import type { Task, Category, StorageInfo } from './types/task';

/**
 * Async Storage Module for Task Manager
 * Uses IndexedDB as primary storage with localStorage fallback.
 * Version 2 adds categories store and new task indexes.
 */
export class TaskStorage {
  private dbName: string = 'TaskManagerDB';
  private dbVersion: number = 2;
  private storeName: string = 'tasks';
  private categoryStoreName: string = 'categories';
  private db: IDBDatabase | null = null;
  private useIndexedDB: boolean = false;

  async init(): Promise<void> {
    try {
      await this.initIndexedDB();
      this.useIndexedDB = true;
      console.log('[Storage] Using IndexedDB');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('[Storage] IndexedDB not available, falling back to localStorage:', msg);
      this.useIndexedDB = false;
    }
  }

  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message ?? 'Unknown error'}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;

        // Tasks store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('dueDate', 'dueDate', { unique: false });
          store.createIndex('categoryId', 'categoryId', { unique: false });
          store.createIndex('parentTaskId', 'parentTaskId', { unique: false });
        } else {
          const store = transaction.objectStore(this.storeName);
          if (!store.indexNames.contains('categoryId')) {
            store.createIndex('categoryId', 'categoryId', { unique: false });
          }
          if (!store.indexNames.contains('parentTaskId')) {
            store.createIndex('parentTaskId', 'parentTaskId', { unique: false });
          }
        }

        // Categories store
        if (!db.objectStoreNames.contains(this.categoryStoreName)) {
          const catStore = db.createObjectStore(this.categoryStoreName, { keyPath: 'id' });
          catStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  // ---- Task CRUD ----

  async getAllTasks(): Promise<Task[]> {
    try {
      if (this.useIndexedDB) {
        return await this.getAllFromIndexedDB();
      } else {
        return this.getAllFromLocalStorage();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Storage] Error getting all tasks:', error);
      throw new Error(`Failed to retrieve tasks: ${msg}`);
    }
  }

  private getAllFromIndexedDB(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result || []).map((task: Record<string, unknown>) => this.migrateTask(task)));
      };

      request.onerror = () => {
        reject(new Error(`Failed to get tasks from IndexedDB: ${request.error?.message}`));
      };
    });
  }

  private getAllFromLocalStorage(): Task[] {
    try {
      const saved = localStorage.getItem('tasks');
      const tasks: Record<string, unknown>[] = saved ? JSON.parse(saved) : [];
      return tasks.map(task => this.migrateTask(task));
    } catch (error) {
      console.error('[Storage] Error reading from localStorage:', error);
      return [];
    }
  }

  async saveTask(task: Task): Promise<Task> {
    try {
      if (this.useIndexedDB) {
        return await this.saveToIndexedDB(task);
      } else {
        return this.saveToLocalStorage(task);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Storage] Error saving task:', error);
      throw new Error(`Failed to save task: ${msg}`);
    }
  }

  private saveToIndexedDB(task: Task): Promise<Task> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(task);

      request.onsuccess = () => {
        resolve(task);
      };

      request.onerror = () => {
        reject(new Error(`Failed to save task to IndexedDB: ${request.error?.message}`));
      };
    });
  }

  private saveToLocalStorage(task: Task): Task {
    const tasks = this.getAllFromLocalStorage();
    const existingIndex = tasks.findIndex(t => t.id === task.id);

    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.unshift(task);
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      if (this.useIndexedDB) {
        await this.deleteFromIndexedDB(taskId);
      } else {
        this.deleteFromLocalStorage(taskId);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Storage] Error deleting task:', error);
      throw new Error(`Failed to delete task: ${msg}`);
    }
  }

  private deleteFromIndexedDB(taskId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(taskId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete task from IndexedDB: ${request.error?.message}`));
      };
    });
  }

  private deleteFromLocalStorage(taskId: string): void {
    const tasks = this.getAllFromLocalStorage();
    const filtered = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(filtered));
  }

  async clearAll(): Promise<void> {
    try {
      if (this.useIndexedDB) {
        await this.clearIndexedDB();
      } else {
        localStorage.removeItem('tasks');
        localStorage.removeItem('categories');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Storage] Error clearing tasks:', error);
      throw new Error(`Failed to clear tasks: ${msg}`);
    }
  }

  private clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear IndexedDB: ${request.error?.message}`));
      };
    });
  }

  // ---- Category CRUD ----

  async getAllCategories(): Promise<Category[]> {
    try {
      if (this.useIndexedDB) {
        return await this.getAllCategoriesFromIndexedDB();
      } else {
        return this.getAllCategoriesFromLocalStorage();
      }
    } catch (error) {
      console.error('[Storage] Error getting categories:', error);
      return [];
    }
  }

  private getAllCategoriesFromIndexedDB(): Promise<Category[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.categoryStoreName], 'readonly');
      const store = transaction.objectStore(this.categoryStoreName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get categories from IndexedDB: ${request.error?.message}`));
      };
    });
  }

  private getAllCategoriesFromLocalStorage(): Category[] {
    try {
      const saved = localStorage.getItem('categories');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('[Storage] Error reading categories from localStorage:', error);
      return [];
    }
  }

  async saveCategory(category: Category): Promise<Category> {
    try {
      if (this.useIndexedDB) {
        return await this.saveCategoryToIndexedDB(category);
      } else {
        return this.saveCategoryToLocalStorage(category);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save category: ${msg}`);
    }
  }

  private saveCategoryToIndexedDB(category: Category): Promise<Category> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.categoryStoreName], 'readwrite');
      const store = transaction.objectStore(this.categoryStoreName);
      const request = store.put(category);

      request.onsuccess = () => {
        resolve(category);
      };

      request.onerror = () => {
        reject(new Error(`Failed to save category to IndexedDB: ${request.error?.message}`));
      };
    });
  }

  private saveCategoryToLocalStorage(category: Category): Category {
    const categories = this.getAllCategoriesFromLocalStorage();
    const existingIndex = categories.findIndex(c => c.id === category.id);

    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }

    localStorage.setItem('categories', JSON.stringify(categories));
    return category;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      if (this.useIndexedDB) {
        await this.deleteCategoryFromIndexedDB(categoryId);
      } else {
        this.deleteCategoryFromLocalStorage(categoryId);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete category: ${msg}`);
    }
  }

  private deleteCategoryFromIndexedDB(categoryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.categoryStoreName], 'readwrite');
      const store = transaction.objectStore(this.categoryStoreName);
      const request = store.delete(categoryId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete category: ${request.error?.message}`));
      };
    });
  }

  private deleteCategoryFromLocalStorage(categoryId: string): void {
    const categories = this.getAllCategoriesFromLocalStorage();
    const filtered = categories.filter(c => c.id !== categoryId);
    localStorage.setItem('categories', JSON.stringify(filtered));
  }

  // ---- Migration ----

  migrateTask(task: Record<string, unknown>): Task {
    // Handle old format where 'completed' boolean was used
    if (task['completed'] !== undefined && !task['status']) {
      task['status'] = task['completed'] ? 'done' : 'pending';
      delete task['completed'];
    }

    // Migrate 'completed' status to 'done' (Part 1 → Part 2)
    if (task['status'] === 'completed') {
      task['status'] = 'done';
    }

    // Handle old format where 'category' string was used
    if (task['category'] !== undefined && !task['tags']) {
      task['tags'] = task['category'] ? [task['category']] : [];
      delete task['category'];
    }

    // Ensure all required fields exist with defaults
    task['tags'] = task['tags'] || [];
    task['status'] = task['status'] || 'pending';
    task['description'] = task['description'] || '';
    task['isDeleted'] = task['isDeleted'] || false;
    task['deletedAt'] = task['deletedAt'] ?? null;
    task['completedAt'] = task['completedAt'] ?? null;
    task['dueDate'] = task['dueDate'] ?? null;

    // New Part 2 fields
    task['categoryId'] = task['categoryId'] ?? null;
    task['parentTaskId'] = task['parentTaskId'] ?? null;
    task['isRecurring'] = task['isRecurring'] || false;
    task['recurrence'] = task['recurrence'] ?? null;
    task['recurringSourceId'] = task['recurringSourceId'] ?? null;

    return task as unknown as Task;
  }

  getStorageInfo(): StorageInfo {
    return {
      type: this.useIndexedDB ? 'IndexedDB' : 'localStorage',
      dbName: this.dbName,
      storeName: this.storeName,
    };
  }
}
