import type { Task, RecurrenceSchedule } from './types/task';

/**
 * Compute the next due date based on a recurrence schedule.
 */
export function computeNextDueDate(currentDueDate: string, schedule: RecurrenceSchedule): string {
  const date = new Date(currentDueDate);
  const { frequency, interval } = schedule;

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7 * interval);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval);
      break;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Given a completed recurring task, generate the next instance.
 * Returns null if the recurrence has ended (past endDate).
 */
export function generateNextRecurrence(completedTask: Task): Task | null {
  if (!completedTask.isRecurring || !completedTask.recurrence || !completedTask.dueDate) {
    return null;
  }

  const nextDueDate = computeNextDueDate(completedTask.dueDate, completedTask.recurrence);

  // Check if past end date
  if (completedTask.recurrence.endDate && nextDueDate > completedTask.recurrence.endDate) {
    return null;
  }

  const newTask: Task = {
    id: crypto.randomUUID(),
    title: completedTask.title,
    description: completedTask.description,
    status: 'pending',
    priority: completedTask.priority,
    dueDate: nextDueDate,
    tags: [...completedTask.tags],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    isDeleted: false,
    deletedAt: null,
    categoryId: completedTask.categoryId,
    parentTaskId: null,
    isRecurring: true,
    recurrence: {
      ...completedTask.recurrence,
      nextDueDate: nextDueDate,
    },
    recurringSourceId: completedTask.recurringSourceId ?? completedTask.id,
  };

  return newTask;
}
