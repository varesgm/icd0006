import type {
  Task,
  TaskStatus,
  TaskPriority,
  Category,
  TaskFilterState,
  SortState,
  SortField,
  RecurrenceFrequency,
} from './types/task';
import { PRIORITY_ORDER, STATUS_ORDER, STATUS_LABELS } from './types/task';
import { TaskStorage } from './storage';
import { TaskValidator } from './validator';
import { filterBy, sortBy } from './utils/generic';
import { generateNextRecurrence } from './recurrence';
import { computeStatistics } from './statistics';

/**
 * Task Manager Application
 * TypeScript implementation with async CRUD operations, recurring tasks,
 * task dependencies, categories, and enhanced statistics.
 */
export class TaskManager {
  public storage: TaskStorage;
  private validator: TaskValidator;
  private tasks: Task[] = [];
  private categories: Category[] = [];
  private categoryMap: Map<string, Category> = new Map();
  private filterState: TaskFilterState = {
    status: 'all',
    priority: null,
    tag: null,
    categoryId: null,
    dateFrom: null,
    dateTo: null,
    searchQuery: '',
  };
  private sortState: SortState = { field: 'default', direction: 'asc' };

  // DOM element references (assigned in bindElements)
  private taskForm!: HTMLFormElement;
  private editForm!: HTMLFormElement;
  private taskList!: HTMLUListElement;
  private loadingIndicator!: HTMLDivElement;
  private searchInput!: HTMLInputElement;
  private filterBtns!: NodeListOf<HTMLButtonElement>;
  private sortSelect!: HTMLSelectElement;
  private dateFromInput!: HTMLInputElement;
  private dateToInput!: HTMLInputElement;
  private clearDateFilterBtn!: HTMLButtonElement;
  private editModal!: HTMLDivElement;
  private closeModalBtns!: NodeListOf<HTMLElement>;
  private totalTasksEl!: HTMLSpanElement;
  private pendingTasksEl!: HTMLSpanElement;
  private inProgressTasksEl!: HTMLSpanElement | null;
  private completedTasksEl!: HTMLSpanElement;
  private overdueCountEl!: HTMLSpanElement | null;
  private completionRateEl!: HTMLSpanElement | null;

  constructor() {
    this.storage = new TaskStorage();
    this.validator = new TaskValidator();
  }

  private initTheme(): void {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset['theme'] = theme;

    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';

    btn?.addEventListener('click', () => {
      const current = document.documentElement.dataset['theme'];
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset['theme'] = next;
      localStorage.setItem('theme', next);
      btn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  async init(): Promise<void> {
    try {
      this.initTheme();
      this.showLoading(true);

      await this.storage.init();
      console.log('[TaskManager] Storage initialized:', this.storage.getStorageInfo());

      this.bindElements();

      // Update storage info display
      const storageTypeEl = document.querySelector('.storage-type');
      if (storageTypeEl) {
        const info = this.storage.getStorageInfo();
        storageTypeEl.textContent = `Using ${info.type}`;
      }

      this.bindEvents();

      // Load data
      await this.loadTasks();
      await this.loadCategories();

      this.showLoading(false);
    } catch (error) {
      this.handleError('Initialization failed', error as Error);
      this.showLoading(false);
    }
  }

  private bindElements(): void {
    this.taskForm = document.getElementById('taskForm') as HTMLFormElement;
    this.editForm = document.getElementById('editForm') as HTMLFormElement;
    this.taskList = document.getElementById('taskList') as HTMLUListElement;
    this.loadingIndicator = document.getElementById('loadingIndicator') as HTMLDivElement;
    this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
    this.filterBtns = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>;
    this.sortSelect = document.getElementById('sortBy') as HTMLSelectElement;
    this.dateFromInput = document.getElementById('dateFrom') as HTMLInputElement;
    this.dateToInput = document.getElementById('dateTo') as HTMLInputElement;
    this.clearDateFilterBtn = document.getElementById('clearDateFilter') as HTMLButtonElement;
    this.editModal = document.getElementById('editModal') as HTMLDivElement;
    this.closeModalBtns = document.querySelectorAll('.close-modal') as NodeListOf<HTMLElement>;
    this.totalTasksEl = document.getElementById('totalTasks') as HTMLSpanElement;
    this.pendingTasksEl = document.getElementById('pendingTasks') as HTMLSpanElement;
    this.inProgressTasksEl = document.getElementById('inProgressTasks') as HTMLSpanElement | null;
    this.completedTasksEl = document.getElementById('completedTasks') as HTMLSpanElement;
    this.overdueCountEl = document.getElementById('overdueCount') as HTMLSpanElement | null;
    this.completionRateEl = document.getElementById('completionRate') as HTMLSpanElement | null;
  }

  private bindEvents(): void {
    // Collapsible add-task form
    const formToggle = document.getElementById('taskFormToggle');
    const formBody = document.querySelector('.task-form-body') as HTMLElement | null;
    const toggleIcon = formToggle?.querySelector('.toggle-icon');
    if (formToggle && formBody && toggleIcon) {
      formToggle.addEventListener('click', () => {
        const isOpen = formBody.style.display !== 'none';
        formBody.style.display = isOpen ? 'none' : 'block';
        toggleIcon.textContent = isOpen ? '+' : '−';
      });
    }

    // Form submissions
    this.taskForm.addEventListener('submit', (e: Event) => this.handleAddTask(e));
    this.editForm.addEventListener('submit', (e: Event) => this.handleEditSubmit(e));

    // Search with debounce
    let searchTimeout: ReturnType<typeof setTimeout>;
    this.searchInput.addEventListener('input', (e: Event) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.handleSearch(e), 300);
    });

    // Filter buttons
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e: Event) => this.handleFilter(e));
    });

    // Sort control
    this.sortSelect.addEventListener('change', (e: Event) => {
      this.sortState.field = (e.target as HTMLSelectElement).value as SortField;
      this.render();
    });

    // Date range filter
    this.dateFromInput.addEventListener('change', () => {
      this.filterState.dateFrom = this.dateFromInput.value || null;
      this.render();
    });
    this.dateToInput.addEventListener('change', () => {
      this.filterState.dateTo = this.dateToInput.value || null;
      this.render();
    });
    this.clearDateFilterBtn.addEventListener('click', () => {
      this.filterState.dateFrom = null;
      this.filterState.dateTo = null;
      this.dateFromInput.value = '';
      this.dateToInput.value = '';
      this.render();
    });

    // Modal events
    this.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeEditModal());
    });
    window.addEventListener('click', (e: Event) => {
      if (e.target === this.editModal) this.closeEditModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.closeEditModal();
    });

    // Event delegation for task list (replaces inline onclick handlers)
    this.taskList.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const taskItem = target.closest('.task-item');
      if (!taskItem) return;
      const taskId = taskItem.getAttribute('data-id');
      if (!taskId) return;

      if (target.closest('.edit-btn')) {
        this.handleEdit(taskId);
      } else if (target.closest('.delete-btn')) {
        this.handleDelete(taskId);
      }
    });

    this.taskList.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.classList.contains('status-select')) {
        const taskItem = target.closest('.task-item');
        const taskId = taskItem?.getAttribute('data-id');
        if (taskId) {
          this.handleStatusChange(taskId, target.value as TaskStatus);
        }
      }
    });

    // Recurring task checkbox toggle
    const recurringCheckbox = document.getElementById('taskRecurring') as HTMLInputElement | null;
    if (recurringCheckbox) {
      recurringCheckbox.addEventListener('change', () => {
        const fields = document.querySelector('.recurrence-fields') as HTMLElement | null;
        if (fields) {
          fields.style.display = recurringCheckbox.checked ? 'flex' : 'none';
        }
      });
    }

    // Edit modal recurring checkbox
    const editRecurringCheckbox = document.getElementById('editRecurring') as HTMLInputElement | null;
    if (editRecurringCheckbox) {
      editRecurringCheckbox.addEventListener('change', () => {
        const fields = document.querySelector('.edit-recurrence-fields') as HTMLElement | null;
        if (fields) {
          fields.style.display = editRecurringCheckbox.checked ? 'flex' : 'none';
        }
      });
    }

    // Category modal — open
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn') as HTMLButtonElement | null;
    const categoryModal = document.getElementById('categoryModal') as HTMLDivElement | null;
    if (manageCategoriesBtn && categoryModal) {
      manageCategoriesBtn.addEventListener('click', () => {
        this.renderCategoryModal();
        categoryModal.style.display = 'flex';
      });
    }

    // Category modal — close
    const closeCategoryModal = document.querySelector('.close-category-modal');
    if (closeCategoryModal && categoryModal) {
      closeCategoryModal.addEventListener('click', () => {
        categoryModal.style.display = 'none';
      });
      categoryModal.addEventListener('click', (e: Event) => {
        if (e.target === categoryModal) categoryModal.style.display = 'none';
      });
    }

    // Category modal — add button
    const addCategoryBtn = document.getElementById('addCategoryBtn') as HTMLButtonElement | null;
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => this.handleAddCategoryFromInput());
    }

    // Category modal — add on Enter
    const newCategoryName = document.getElementById('newCategoryName') as HTMLInputElement | null;
    if (newCategoryName) {
      newCategoryName.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') this.handleAddCategoryFromInput();
      });
    }

    // Event delegation for tag filter buttons (avoids re-attaching on every render)
    const tagFilterContainer = document.getElementById('tagFilterButtons');
    if (tagFilterContainer) {
      tagFilterContainer.addEventListener('click', (e: Event) => {
        const btn = (e.target as HTMLElement).closest('.tag-filter-btn') as HTMLButtonElement | null;
        if (!btn) return;
        const clickedTag = btn.dataset['tag'] ?? '';
        this.filterState.tag = this.filterState.tag === clickedTag ? null : clickedTag;
        this.render();
      });
    }

    // Event delegation for category filter buttons
    const categoryFilterContainer = document.getElementById('categoryFilterButtons');
    if (categoryFilterContainer) {
      categoryFilterContainer.addEventListener('click', (e: Event) => {
        const btn = (e.target as HTMLElement).closest('.category-filter-btn') as HTMLButtonElement | null;
        if (!btn) return;
        const catId = btn.dataset['categoryId'] ?? '';
        this.filterState.categoryId = this.filterState.categoryId === catId ? null : catId;
        this.render();
      });
    }
  }

  // ---- Data Loading ----

  private rebuildCategoryMap(): void {
    this.categoryMap = new Map(this.categories.map(c => [c.id, c]));
  }

  private async loadTasks(): Promise<void> {
    try {
      this.tasks = await this.storage.getAllTasks();
      this.render();
    } catch (error) {
      this.handleError('Failed to load tasks', error as Error);
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.storage.getAllCategories();
      this.rebuildCategoryMap();
      this.renderCategorySelects();
      this.renderCategoryFilter();
    } catch (error) {
      this.handleError('Failed to load categories', error as Error);
    }
  }

  // ---- Task CRUD ----

  private async handleAddTask(e: Event): Promise<void> {
    e.preventDefault();


    try {
      const formData = this.getFormData();

      const validation = this.validator.validateTask(formData);
      if (!validation.isValid) {
        this.displayValidationErrors(validation.errors);
        return;
      }

      const task: Task = {
        id: crypto.randomUUID(),
        ...(formData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'isDeleted' | 'deletedAt'>),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        isDeleted: false,
        deletedAt: null,
      } as Task;

      await this.storage.saveTask(task);
      this.tasks.unshift(task);
      this.taskForm.reset();

      // Reset recurrence fields visibility
      const fields = document.querySelector('.recurrence-fields') as HTMLElement | null;
      if (fields) fields.style.display = 'none';

      this.render();
      this.showNotification('Task created successfully', 'success');
    } catch (error) {
      this.handleError('Failed to create task', error as Error);
    }
  }

  async handleStatusChange(taskId: string, newStatus: TaskStatus): Promise<void> {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Validate status
      const statusErrors = this.validator.validateField(
        'status',
        newStatus,
        this.validator.rules['status']
      );
      if (statusErrors.length > 0) {
        throw new Error(`Invalid status: ${statusErrors.join(', ')}`);
      }

      // Dependency check: cannot mark 'done' if parent is not 'done'
      if (newStatus === 'done' && task.parentTaskId) {
        const parent = this.tasks.find(t => t.id === task.parentTaskId);
        if (parent && parent.status !== 'done') {
          this.showNotification(
            `Cannot complete: parent task "${parent.title}" must be completed first.`,
            'error'
          );
          this.render(); // Re-render to reset the select
          return;
        }
      }

      task.status = newStatus;
      task.updatedAt = new Date().toISOString();

      if (newStatus === 'done') {
        task.completedAt = new Date().toISOString();

        // Handle recurring tasks
        if (task.isRecurring && task.recurrence) {
          const nextTask = generateNextRecurrence(task);
          if (nextTask) {
            await this.storage.saveTask(nextTask);
            this.tasks.push(nextTask);
            this.showNotification('Next recurring task created', 'info');
          }
        }
      } else {
        task.completedAt = null;
      }

      await this.storage.saveTask(task);
      this.render();
      this.showNotification(`Task marked as ${STATUS_LABELS[newStatus]}`, 'success');
    } catch (error) {
      this.handleError('Failed to update task status', error as Error);
    }
  }

  async handleDelete(taskId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Soft delete
      task.isDeleted = true;
      task.deletedAt = new Date().toISOString();
      task.updatedAt = new Date().toISOString();

      await this.storage.saveTask(task);
      this.render();
      this.showNotification('Task deleted successfully', 'success');
    } catch (error) {
      this.handleError('Failed to delete task', error as Error);
    }
  }

  handleEdit(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      this.handleError('Task not found', new Error(`Task with ID ${taskId} not found`));
      return;
    }

    (document.getElementById('editTaskId') as HTMLInputElement).value = task.id;
    (document.getElementById('editTitle') as HTMLInputElement).value = task.title;
    (document.getElementById('editDescription') as HTMLTextAreaElement).value = task.description || '';
    (document.getElementById('editPriority') as HTMLSelectElement).value = task.priority;
    (document.getElementById('editStatus') as HTMLSelectElement).value = task.status;
    (document.getElementById('editDueDate') as HTMLInputElement).value = task.dueDate || '';
    (document.getElementById('editTags') as HTMLInputElement).value = (task.tags || []).join(', ');

    // Category
    const editCategory = document.getElementById('editCategory') as HTMLSelectElement | null;
    if (editCategory) editCategory.value = task.categoryId || '';

    // Parent task
    const editParent = document.getElementById('editParent') as HTMLSelectElement | null;
    if (editParent) {
      this.populateParentSelect('editParent', task.id);
      editParent.value = task.parentTaskId || '';
    }

    // Recurrence
    const editRecurring = document.getElementById('editRecurring') as HTMLInputElement | null;
    if (editRecurring) {
      editRecurring.checked = task.isRecurring;
      const fields = document.querySelector('.edit-recurrence-fields') as HTMLElement | null;
      if (fields) fields.style.display = task.isRecurring ? 'flex' : 'none';

      if (task.recurrence) {
        const freqEl = document.getElementById('editRecurrenceFrequency') as HTMLSelectElement | null;
        const intEl = document.getElementById('editRecurrenceInterval') as HTMLInputElement | null;
        if (freqEl) freqEl.value = task.recurrence.frequency;
        if (intEl) intEl.value = String(task.recurrence.interval);
      }
    }

    this.editModal.style.display = 'block';
  }

  private async handleEditSubmit(e: Event): Promise<void> {
    e.preventDefault();


    try {
      const taskId = (document.getElementById('editTaskId') as HTMLInputElement).value;
      const task = this.tasks.find(t => t.id === taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      const formData = this.getEditFormData();

      const validation = this.validator.validateTask(formData);
      if (!validation.isValid) {
        this.displayValidationErrors(validation.errors);
        return;
      }

      // Dependency check for status change to 'done'
      if (formData.status === 'done' && task.parentTaskId) {
        const parent = this.tasks.find(t => t.id === task.parentTaskId);
        if (parent && parent.status !== 'done') {
          this.showNotification(
            `Cannot complete: parent task "${parent.title}" must be completed first.`,
            'error'
          );
          return;
        }
      }

      const wasDone = task.status === 'done';
      Object.assign(task, formData, {
        updatedAt: new Date().toISOString(),
      });

      if (task.status === 'done') {
        task.completedAt = task.completedAt || new Date().toISOString();

        // Handle recurring: generate next if newly marked done
        if (!wasDone && task.isRecurring && task.recurrence) {
          const nextTask = generateNextRecurrence(task);
          if (nextTask) {
            await this.storage.saveTask(nextTask);
            this.tasks.push(nextTask);
            this.showNotification('Next recurring task created', 'info');
          }
        }
      } else {
        task.completedAt = null;
      }

      await this.storage.saveTask(task);
      this.closeEditModal();
      this.render();
      this.showNotification('Task updated successfully', 'success');
    } catch (error) {
      this.handleError('Failed to update task', error as Error);
    }
  }

  // ---- Search & Filter ----

  private handleSearch(e: Event): void {
    this.filterState.searchQuery = ((e.target as HTMLInputElement).value || '').toLowerCase().trim();
    this.render();
  }

  private handleFilter(e: Event): void {
    const btn = e.target as HTMLButtonElement;
    const filterType = btn.dataset['filter'];
    const priorityType = btn.dataset['priority'] as TaskPriority | undefined;

    if (filterType) {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.filterState.status = filterType === 'all' ? 'all' : filterType as TaskStatus;
    }

    if (priorityType) {
      const wasActive = btn.classList.contains('active');
      document.querySelectorAll('.filter-btn[data-priority]').forEach(b => b.classList.remove('active'));

      if (wasActive) {
        this.filterState.priority = null;
      } else {
        btn.classList.add('active');
        this.filterState.priority = priorityType;
      }
    }

    this.render();
  }

  // ---- Form Data ----

  private readFormFields(prefix: 'task' | 'edit'): Partial<Task> {
    const id = (name: string) => prefix === 'task' ? `task${name}` : `edit${name}`;

    const title = this.validator.sanitizeString(
      (document.getElementById(id('Title')) as HTMLInputElement).value
    );
    const description = this.validator.sanitizeString(
      (document.getElementById(id('Description')) as HTMLTextAreaElement).value
    );
    const priority = (document.getElementById(id('Priority')) as HTMLSelectElement).value as TaskPriority;
    const dueDate = (document.getElementById(id('DueDate')) as HTMLInputElement).value || null;
    const tagsInput = (document.getElementById(id('Tags')) as HTMLInputElement).value;
    const tags = this.validator.sanitizeTags(
      tagsInput.split(',').map(t => t.trim()).filter(t => t)
    );

    const categorySelect = document.getElementById(id('Category')) as HTMLSelectElement | null;
    const categoryId = categorySelect?.value || null;

    const parentSelect = document.getElementById(id('Parent')) as HTMLSelectElement | null;
    const parentTaskId = parentSelect?.value || null;

    const recurringCheckbox = document.getElementById(id('Recurring')) as HTMLInputElement | null;
    const isRecurring = recurringCheckbox?.checked || false;
    let recurrence = null;
    if (isRecurring) {
      const freqEl = document.getElementById(id('RecurrenceFrequency')) as HTMLSelectElement | null;
      const intEl = document.getElementById(id('RecurrenceInterval')) as HTMLInputElement | null;
      recurrence = {
        frequency: (freqEl?.value || 'weekly') as RecurrenceFrequency,
        interval: parseInt(intEl?.value || '1', 10) || 1,
      };
    }

    return { title, description, priority, dueDate, tags, categoryId, parentTaskId, isRecurring, recurrence };
  }

  private getFormData(): Partial<Task> {
    return {
      ...this.readFormFields('task'),
      status: 'pending' as TaskStatus,
      recurringSourceId: null,
    };
  }

  private getEditFormData(): Partial<Task> {
    const status = (document.getElementById('editStatus') as HTMLSelectElement).value as TaskStatus;
    return {
      ...this.readFormFields('edit'),
      status,
    };
  }

  // ---- Filtering & Sorting ----

  private getFilteredTasks(): Task[] {
    // Exclude soft-deleted tasks
    let filtered = filterBy(this.tasks, t => !t.isDeleted);

    // Filter by status
    if (this.filterState.status !== 'all') {
      filtered = filterBy(filtered, t => t.status === this.filterState.status);
    }

    // Filter by priority
    if (this.filterState.priority) {
      filtered = filterBy(filtered, t => t.priority === this.filterState.priority);
    }

    // Filter by category
    if (this.filterState.categoryId) {
      filtered = filterBy(filtered, t => t.categoryId === this.filterState.categoryId);
    }

    // Filter by tag
    if (this.filterState.tag) {
      const tag = this.filterState.tag;
      filtered = filterBy(filtered, t => t.tags.includes(tag));
    }

    // Filter by date range
    if (this.filterState.dateFrom) {
      const from = this.filterState.dateFrom;
      filtered = filterBy(filtered, t => !!t.dueDate && t.dueDate >= from);
    }
    if (this.filterState.dateTo) {
      const to = this.filterState.dateTo;
      filtered = filterBy(filtered, t => !!t.dueDate && t.dueDate <= to);
    }

    // Enhanced search: covers title, description, tags, and category name
    if (this.filterState.searchQuery) {
      const q = this.filterState.searchQuery;
      filtered = filterBy(filtered, t => {
        const catName = t.categoryId
          ? this.categoryMap.get(t.categoryId)?.name?.toLowerCase() ?? ''
          : '';
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.tags.some(tag => tag.toLowerCase().includes(q)) ||
          catName.includes(q)
        );
      });
    }

    // Sorting
    switch (this.sortState.field) {
      case 'title':
        filtered = sortBy(filtered, t => t.title, this.sortState.direction);
        break;
      case 'priority':
        filtered = sortBy(filtered, t => PRIORITY_ORDER[t.priority], this.sortState.direction);
        break;
      case 'dueDate':
        filtered = sortBy(filtered, t => t.dueDate, this.sortState.direction);
        break;
      case 'createdAt':
        filtered = sortBy(
          filtered,
          t => t.createdAt,
          this.sortState.direction === 'asc' ? 'desc' : 'asc'
        );
        break;
      case 'status':
        filtered = sortBy(filtered, t => STATUS_ORDER[t.status], this.sortState.direction);
        break;
      case 'category':
        filtered = sortBy(filtered, t => {
          const cat = t.categoryId ? this.categoryMap.get(t.categoryId) : undefined;
          return cat?.name ?? 'zzz';
        }, this.sortState.direction);
        break;
      default:
        // Default composite sort: status -> priority -> dueDate
        filtered.sort((a, b) => {
          if (a.status !== b.status) {
            if (a.status === 'done' || a.status === 'cancelled') return 1;
            if (b.status === 'done' || b.status === 'cancelled') return -1;
          }
          const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          if (pd !== 0) return pd;
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        });
    }

    return filtered;
  }

  // ---- Category Management ----

  private async handleAddCategoryFromInput(): Promise<void> {
    const input = document.getElementById('newCategoryName') as HTMLInputElement | null;
    if (!input || !input.value.trim()) return;

    const name = this.validator.sanitizeString(input.value);
    if (!name) return;

    // Check for duplicate
    if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.showNotification('Category already exists', 'error');
      return;
    }

    const colorInput = document.getElementById('newCategoryColor') as HTMLInputElement | null;
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      color: colorInput?.value ?? '#3b82f6',
      createdAt: new Date().toISOString(),
    };

    try {
      await this.storage.saveCategory(category);
      this.categories.push(category);
      this.rebuildCategoryMap();
      input.value = '';
      this.renderCategorySelects();
      this.renderCategoryFilter();
      this.renderCategoryModal();
      this.showNotification(`Category "${name}" created`, 'success');
    } catch (error) {
      this.handleError('Failed to create category', error as Error);
    }
  }

  private renderCategoryModal(): void {
    const list = document.getElementById('categoryList');
    if (!list) return;

    if (this.categories.length === 0) {
      list.innerHTML = '<li class="category-list-empty">No categories yet. Add one below.</li>';
      return;
    }

    list.innerHTML = this.categories.map(cat => `
      <li>
        <span class="category-color-swatch" style="background:${this.escapeHtml(cat.color ?? '#3b82f6')}"></span>
        <span class="category-list-name">${this.escapeHtml(cat.name)}</span>
        <button class="category-delete-btn" data-cat-id="${cat.id}" title="Delete category">🗑</button>
      </li>
    `).join('');

    list.querySelectorAll('.category-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e: Event) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset['catId'];
        if (id) {
          await this.handleDeleteCategory(id);
          this.renderCategoryModal();
        }
      });
    });
  }

  private async handleDeleteCategory(categoryId: string): Promise<void> {
    const cat = this.categories.find(c => c.id === categoryId);
    if (!cat) return;

    try {
      await this.storage.deleteCategory(categoryId);
      this.categories = this.categories.filter(c => c.id !== categoryId);
      this.rebuildCategoryMap();

      // Unassign tasks from deleted category
      for (const task of this.tasks) {
        if (task.categoryId === categoryId) {
          task.categoryId = null;
          task.updatedAt = new Date().toISOString();
          await this.storage.saveTask(task);
        }
      }

      this.renderCategorySelects();
      this.renderCategoryFilter();
      this.render();
      this.showNotification(`Category "${cat.name}" deleted`, 'success');
    } catch (error) {
      this.handleError('Failed to delete category', error as Error);
    }
  }

  // ---- Rendering ----

  private render(): void {
    const filtered = this.getFilteredTasks();

    this.renderTagFilters();
    this.renderStats();

    if (filtered.length === 0) {
      this.taskList.innerHTML = `
        <li class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No tasks found</h3>
          <p>${this.filterState.searchQuery ? 'Try adjusting your search' : 'Add a new task to get started'}</p>
        </li>
      `;
      return;
    }

    this.taskList.innerHTML = filtered.map(task => this.renderTask(task)).join('');
  }

  private renderTask(task: Task): string {
    const overdue = this.isOverdue(task);
    const statusClass = task.status;

    // Category name
    const category = task.categoryId
      ? this.categoryMap.get(task.categoryId) ?? null
      : null;

    // Parent task info
    const parentTask = task.parentTaskId
      ? this.tasks.find(t => t.id === task.parentTaskId)
      : null;

    return `
      <li class="task-item ${statusClass} ${overdue ? 'overdue' : ''}" data-id="${task.id}">
        <div class="task-status-control">
          <select class="status-select">
            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
            <option value="cancelled" ${task.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        <div class="task-content">
          <div class="task-title">
            ${this.escapeHtml(task.title)}
            ${task.isRecurring ? '<span class="task-recurring" title="Recurring task">🔄</span>' : ''}
            ${parentTask ? `<span class="task-dependency" title="Depends on: ${this.escapeHtml(parentTask.title)}">🔗</span>` : ''}
          </div>
          <div class="task-meta">
            <span class="task-priority ${task.priority}">${task.priority}</span>
            <span class="task-status-badge ${task.status}">${STATUS_LABELS[task.status]}</span>
            ${category ? `<span class="category-badge">${this.escapeHtml(category.name)}</span>` : ''}
            ${task.dueDate ? `
              <span class="due-date ${overdue ? 'overdue' : ''}">
                ${overdue ? '⚠️ ' : ''}Due: ${this.formatDate(task.dueDate)}
              </span>
            ` : ''}
          </div>
          ${task.tags && task.tags.length > 0 ? `
            <div class="task-tags">
              ${task.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
          ${task.description ? `
            <p class="task-description">${this.escapeHtml(task.description)}</p>
          ` : ''}
          ${parentTask ? `
            <div class="task-dependency-info">Depends on: ${this.escapeHtml(parentTask.title)}</div>
          ` : ''}
        </div>
        <div class="task-actions">
          <button class="edit-btn" title="Edit">✏️</button>
          <button class="delete-btn" title="Delete">🗑️</button>
        </div>
      </li>
    `;
  }

  private renderTagFilters(): void {
    const section = document.getElementById('tagFilterSection');
    const container = document.getElementById('tagFilterButtons');
    if (!section || !container) return;

    const activeTasks = this.tasks.filter(t => !t.isDeleted);
    const allTags = new Set<string>();
    activeTasks.forEach(t => {
      if (t.tags) t.tags.forEach(tag => allTags.add(tag));
    });

    if (allTags.size === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    const sortedTags = [...allTags].sort();

    container.innerHTML = sortedTags.map(tag =>
      `<button class="filter-btn tag-filter-btn ${this.filterState.tag === tag ? 'active' : ''}"
              data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</button>`
    ).join('');
  }

  private renderCategoryFilter(): void {
    const section = document.getElementById('categoryFilterSection');
    const container = document.getElementById('categoryFilterButtons');
    if (!section || !container) return;

    if (this.categories.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = this.categories.map(cat =>
      `<button class="filter-btn category-filter-btn ${this.filterState.categoryId === cat.id ? 'active' : ''}"
              data-category-id="${cat.id}">${this.escapeHtml(cat.name)}</button>`
    ).join('');
  }

  private renderCategorySelects(): void {
    const selects = document.querySelectorAll('#taskCategory, #editCategory') as NodeListOf<HTMLSelectElement>;
    selects.forEach(select => {
      const currentVal = select.value;
      select.innerHTML = '<option value="">-- No Category --</option>' +
        this.categories.map(cat =>
          `<option value="${cat.id}">${this.escapeHtml(cat.name)}</option>`
        ).join('');
      select.value = currentVal;
    });
  }

  private populateParentSelect(selectId: string, excludeTaskId?: string): void {
    const select = document.getElementById(selectId) as HTMLSelectElement | null;
    if (!select) return;

    const activeTasks = this.tasks.filter(t => !t.isDeleted && t.id !== excludeTaskId);
    select.innerHTML = '<option value="">-- None --</option>' +
      activeTasks.map(t =>
        `<option value="${t.id}">${this.escapeHtml(t.title)}</option>`
      ).join('');
  }

  private renderStats(): void {
    const stats = computeStatistics(this.tasks, this.categories);

    this.totalTasksEl.textContent = `Total: ${stats.totalActive}`;
    this.pendingTasksEl.textContent = `Pending: ${stats.byStatus.pending}`;
    if (this.inProgressTasksEl) {
      this.inProgressTasksEl.textContent = `In Progress: ${stats.byStatus['in-progress']}`;
    }
    this.completedTasksEl.textContent = `Done: ${stats.byStatus.done}`;
    if (this.overdueCountEl) {
      this.overdueCountEl.textContent = `Overdue: ${stats.overdueCount}`;
    }
    if (this.completionRateEl) {
      this.completionRateEl.textContent = `Completion: ${stats.completionRate}%`;
    }
  }

  // ---- Utilities ----

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  closeEditModal(): void {
    this.editModal.style.display = 'none';
    this.editForm.reset();

  }

  private showLoading(show: boolean): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = show ? 'flex' : 'none';
    }
  }

  private handleError(context: string, error: Error): void {
    console.error(`[TaskManager] ${context}:`, error);
    this.showNotification(`${context}: ${error.message}`, 'error');
  }

  private displayValidationErrors(errors: Record<string, string[]>): void {
    const messages = Object.entries(errors)
      .map(([field, errs]) => `${field}: ${errs.join(', ')}`)
      .join('\n');
    this.showNotification(`Validation errors:\n${messages}`, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
