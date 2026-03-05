import type { Task, Category } from './types/task';
import type { TaskStorage } from './storage';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SEED_CATEGORIES: Category[] = [
  { id: 'seed-cat-work', name: 'Work', color: '#3b82f6', createdAt: isoAgo(30) },
  { id: 'seed-cat-personal', name: 'Personal', color: '#10b981', createdAt: isoAgo(30) },
  { id: 'seed-cat-shopping', name: 'Shopping', color: '#f59e0b', createdAt: isoAgo(20) },
  { id: 'seed-cat-health', name: 'Health', color: '#ef4444', createdAt: isoAgo(20) },
  { id: 'seed-cat-learning', name: 'Learning', color: '#8b5cf6', createdAt: isoAgo(15) },
];

function makeSeedTasks(): Task[] {
  const base = {
    isDeleted: false,
    deletedAt: null,
    completedAt: null,
    parentTaskId: null,
    isRecurring: false,
    recurrence: null,
    recurringSourceId: null,
  };

  return [
    // --- Critical / pending / overdue ---
    {
      ...base,
      id: 'seed-task-01',
      title: 'Fix production login bug',
      description: 'Users are unable to log in after the last deployment. Rolled back auth middleware, root cause still unknown.',
      status: 'pending',
      priority: 'critical',
      dueDate: daysFromNow(-3),
      tags: ['bug', 'auth', 'urgent'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(5),
      updatedAt: isoAgo(1),
    },

    // --- Critical / in-progress / overdue ---
    {
      ...base,
      id: 'seed-task-02',
      title: 'Database migration rollout',
      description: 'Rolling out v2 schema across all regions. Staging done, production pending.',
      status: 'in-progress',
      priority: 'critical',
      dueDate: daysFromNow(-1),
      tags: ['database', 'migration', 'infra'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(7),
      updatedAt: isoAgo(0),
    },

    // --- High / pending / due today ---
    {
      ...base,
      id: 'seed-task-03',
      title: 'Prepare Q1 performance review',
      description: 'Compile metrics, write self-assessment, and submit to HR portal by end of day.',
      status: 'pending',
      priority: 'high',
      dueDate: daysFromNow(0),
      tags: ['hr', 'review'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(3),
      updatedAt: isoAgo(3),
    },

    // --- High / in-progress / due soon ---
    {
      ...base,
      id: 'seed-task-04',
      title: 'Implement task filtering UI',
      description: 'Add filter sidebar with status, priority, category, and date range controls.',
      status: 'in-progress',
      priority: 'high',
      dueDate: daysFromNow(2),
      tags: ['frontend', 'ui'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(4),
      updatedAt: isoAgo(1),
    },

    // --- Medium / pending / future ---
    {
      ...base,
      id: 'seed-task-05',
      title: 'Write unit tests for storage module',
      description: 'Cover IndexedDB CRUD, localStorage fallback, and migration logic.',
      status: 'pending',
      priority: 'medium',
      dueDate: daysFromNow(7),
      tags: ['testing', 'storage'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(2),
      updatedAt: isoAgo(2),
    },

    // --- Medium / done / completed ---
    {
      ...base,
      id: 'seed-task-06',
      title: 'Set up Vite project structure',
      description: 'Configure TypeScript strict mode, path aliases, and HMR.',
      status: 'done',
      priority: 'medium',
      dueDate: daysFromNow(-10),
      tags: ['setup', 'vite'],
      categoryId: 'seed-cat-work',
      completedAt: isoAgo(10),
      createdAt: isoAgo(15),
      updatedAt: isoAgo(10),
    },

    // --- Low / cancelled ---
    {
      ...base,
      id: 'seed-task-07',
      title: 'Migrate from localStorage to SQLite',
      description: 'Explore using SQLite WASM as storage backend. Cancelled — IndexedDB is sufficient.',
      status: 'cancelled',
      priority: 'low',
      dueDate: null,
      tags: ['database', 'research'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(20),
      updatedAt: isoAgo(8),
    },

    // --- Personal / high / pending ---
    {
      ...base,
      id: 'seed-task-08',
      title: 'Book dentist appointment',
      description: 'Call Dr. Mäe office before end of month. Ask about whitening options.',
      status: 'pending',
      priority: 'high',
      dueDate: daysFromNow(5),
      tags: ['health', 'appointment'],
      categoryId: 'seed-cat-personal',
      createdAt: isoAgo(1),
      updatedAt: isoAgo(1),
    },

    // --- Personal / low / no due date ---
    {
      ...base,
      id: 'seed-task-09',
      title: 'Reorganise home office',
      description: 'Cable management, new monitor arm, clear desk. Low priority but long overdue.',
      status: 'pending',
      priority: 'low',
      dueDate: null,
      tags: ['home', 'organisation'],
      categoryId: 'seed-cat-personal',
      createdAt: isoAgo(14),
      updatedAt: isoAgo(14),
    },

    // --- Shopping / medium ---
    {
      ...base,
      id: 'seed-task-10',
      title: 'Buy groceries for the week',
      description: 'Milk, eggs, bread, vegetables, chicken, coffee. Check fridge first.',
      status: 'pending',
      priority: 'medium',
      dueDate: daysFromNow(1),
      tags: ['groceries', 'weekly'],
      categoryId: 'seed-cat-shopping',
      createdAt: isoAgo(0),
      updatedAt: isoAgo(0),
    },

    // --- Shopping / done ---
    {
      ...base,
      id: 'seed-task-11',
      title: 'Order new keyboard',
      description: 'Keychron K3 Pro, brown switches. Ordered from Amazon.',
      status: 'done',
      priority: 'low',
      dueDate: daysFromNow(-5),
      tags: ['peripherals', 'work-from-home'],
      categoryId: 'seed-cat-shopping',
      completedAt: isoAgo(5),
      createdAt: isoAgo(8),
      updatedAt: isoAgo(5),
    },

    // --- Health / critical ---
    {
      ...base,
      id: 'seed-task-12',
      title: 'Take daily medication',
      description: 'Vitamin D 2000 IU + Omega-3 each morning with breakfast.',
      status: 'in-progress',
      priority: 'critical',
      dueDate: daysFromNow(0),
      tags: ['daily', 'medication'],
      categoryId: 'seed-cat-health',
      isRecurring: true,
      recurrence: {
        frequency: 'daily',
        interval: 1,
        nextDueDate: daysFromNow(1),
      },
      createdAt: isoAgo(30),
      updatedAt: isoAgo(0),
    },

    // --- Health / medium / future ---
    {
      ...base,
      id: 'seed-task-13',
      title: 'Go for a 30-minute run',
      description: '3x per week. Track with Strava.',
      status: 'pending',
      priority: 'medium',
      dueDate: daysFromNow(2),
      tags: ['exercise', 'running'],
      categoryId: 'seed-cat-health',
      isRecurring: true,
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        nextDueDate: daysFromNow(2),
      },
      createdAt: isoAgo(10),
      updatedAt: isoAgo(2),
    },

    // --- Learning / in-progress ---
    {
      ...base,
      id: 'seed-task-14',
      title: 'Complete TypeScript advanced types chapter',
      description: 'Conditional types, mapped types, template literals. Finish by end of week.',
      status: 'in-progress',
      priority: 'medium',
      dueDate: daysFromNow(4),
      tags: ['typescript', 'course'],
      categoryId: 'seed-cat-learning',
      createdAt: isoAgo(6),
      updatedAt: isoAgo(1),
    },

    // --- Learning / done ---
    {
      ...base,
      id: 'seed-task-15',
      title: 'Read "Clean Code" chapters 1-5',
      description: 'Naming, functions, comments. Take notes for team knowledge-share.',
      status: 'done',
      priority: 'low',
      dueDate: daysFromNow(-7),
      tags: ['reading', 'clean-code'],
      categoryId: 'seed-cat-learning',
      completedAt: isoAgo(7),
      createdAt: isoAgo(14),
      updatedAt: isoAgo(7),
    },

    // --- Parent task (no category) ---
    {
      ...base,
      id: 'seed-task-16',
      title: 'Launch new product feature',
      description: 'Umbrella task for the new task dependency feature. See subtasks for breakdown.',
      status: 'in-progress',
      priority: 'high',
      dueDate: daysFromNow(14),
      tags: ['milestone'],
      categoryId: 'seed-cat-work',
      createdAt: isoAgo(10),
      updatedAt: isoAgo(1),
    },

    // --- Child task 1 of seed-task-16 ---
    {
      ...base,
      id: 'seed-task-17',
      title: 'Design data model for dependencies',
      description: 'Finalize parentTaskId schema, update IndexedDB store.',
      status: 'done',
      priority: 'high',
      dueDate: daysFromNow(-2),
      tags: ['design', 'database'],
      categoryId: 'seed-cat-work',
      parentTaskId: 'seed-task-16',
      completedAt: isoAgo(3),
      createdAt: isoAgo(9),
      updatedAt: isoAgo(3),
    },

    // --- Child task 2 of seed-task-16 ---
    {
      ...base,
      id: 'seed-task-18',
      title: 'Implement dependency UI in task form',
      description: 'Add parent task selector dropdown to the create/edit form.',
      status: 'in-progress',
      priority: 'medium',
      dueDate: daysFromNow(3),
      tags: ['frontend', 'ui'],
      categoryId: 'seed-cat-work',
      parentTaskId: 'seed-task-16',
      createdAt: isoAgo(5),
      updatedAt: isoAgo(1),
    },

    // --- No category / no tags / no due date ---
    {
      ...base,
      id: 'seed-task-19',
      title: 'Think about next quarter goals',
      description: '',
      status: 'pending',
      priority: 'low',
      dueDate: null,
      tags: [],
      categoryId: null,
      createdAt: isoAgo(1),
      updatedAt: isoAgo(1),
    },

    // --- Soft-deleted task ---
    {
      ...base,
      id: 'seed-task-20',
      title: 'Old task (deleted)',
      description: 'This task was soft-deleted and should only appear in the trash view.',
      status: 'cancelled',
      priority: 'low',
      dueDate: null,
      tags: ['deleted'],
      categoryId: null,
      isDeleted: true,
      deletedAt: isoAgo(2),
      createdAt: isoAgo(10),
      updatedAt: isoAgo(2),
    },
  ] as Task[];
}

export async function seedDatabase(storage: TaskStorage): Promise<void> {
  const categories = SEED_CATEGORIES;
  const tasks = makeSeedTasks();

  for (const cat of categories) {
    await storage.saveCategory(cat);
  }

  for (const task of tasks) {
    await storage.saveTask(task);
  }

  console.log(`[Seed] Seeded ${categories.length} categories and ${tasks.length} tasks. Reload to see changes.`);
}

export async function clearSeedData(storage: TaskStorage): Promise<void> {
  const tasks = makeSeedTasks();
  for (const task of tasks) {
    await storage.deleteTask(task.id);
  }

  for (const cat of SEED_CATEGORIES) {
    await storage.deleteCategory(cat.id);
  }

  console.log('[Seed] Seed data cleared.');
}
