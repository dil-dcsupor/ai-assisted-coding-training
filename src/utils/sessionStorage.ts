import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates if an unknown value is a valid Todo object
 */
function isValidTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.completed === 'boolean' &&
    obj.createdAt instanceof Date &&
    !isNaN(obj.createdAt.getTime()) // Ensure Date is valid
  );
}

/**
 * Validates if an unknown value is a valid array of Todo objects
 */
function isValidTodos(value: unknown): value is Todo[] {
  return Array.isArray(value) && value.every(isValidTodo);
}

/**
 * Loads todos from sessionStorage
 * Returns empty array if storage is empty, corrupt, or contains invalid data
 */
export function loadTodos(): Todo[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored, (key, value) => {
      // Revive Date objects that were stringified
      if (key === 'createdAt' && typeof value === 'string') {
        return new Date(value);
      }
      return value;
    });

    if (isValidTodos(parsed)) {
      return parsed;
    } else {
      console.warn('Invalid todos data found in sessionStorage, clearing storage');
      sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Saves todos to sessionStorage
 * Returns true if successful, false if quota exceeded or other error
 */
export function saveTodos(todos: Todo[]): boolean {
  try {
    const serialized = JSON.stringify(todos);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded - todos not saved:', error);
      return false;
    } else {
      console.error('Failed to save todos to sessionStorage:', error);
      return false;
    }
  }
}

/**
 * Clears todos from sessionStorage
 */
export function clearTodos(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear todos from sessionStorage:', error);
  }
}
