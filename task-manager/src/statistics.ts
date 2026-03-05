import type { Task, TaskStatus, TaskPriority, TaskStatistics, Category } from './types/task';

/**
 * Compute comprehensive statistics for the task collection.
 * Single-pass over active tasks for all metrics.
 */
export function computeStatistics(tasks: Task[], categories: Category[]): TaskStatistics {
  const byStatus: Record<TaskStatus, number> = {
    pending: 0,
    'in-progress': 0,
    done: 0,
    cancelled: 0,
  };
  const byPriority: Record<TaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const tasksByCategory: Record<string, number> = {};
  for (const cat of categories) {
    tasksByCategory[cat.id] = 0;
  }
  tasksByCategory['uncategorized'] = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalActive = 0;
  let overdueCount = 0;

  for (const task of tasks) {
    if (task.isDeleted) continue;

    totalActive++;
    byStatus[task.status]++;
    byPriority[task.priority]++;

    if (task.categoryId && task.categoryId in tasksByCategory) {
      tasksByCategory[task.categoryId]++;
    } else if (!task.categoryId) {
      tasksByCategory['uncategorized']++;
    }

    if (
      task.dueDate &&
      task.status !== 'done' &&
      task.status !== 'cancelled' &&
      new Date(task.dueDate) < today
    ) {
      overdueCount++;
    }
  }

  const completable = totalActive - byStatus.cancelled;
  const completionRate = completable > 0
    ? Math.round((byStatus.done / completable) * 100)
    : 0;

  return {
    byStatus,
    byPriority,
    overdueCount,
    completionRate,
    tasksByCategory,
    totalActive,
  };
}
