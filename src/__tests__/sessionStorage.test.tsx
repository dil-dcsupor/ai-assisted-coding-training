import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, clearTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const createMockSessionStorage = () => {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: vi.fn((key: string): string | null => store[key] || null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

const mockSessionStorage = createMockSessionStorage();

// Mock console methods to avoid noise in tests
const consoleSpy = {
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('sessionStorage utilities', () => {
  beforeEach(() => {
    // Reset mocks
    Object.keys(mockSessionStorage.store).forEach(key => delete mockSessionStorage.store[key]);
    vi.clearAllMocks();
  });

  describe('loadTodos', () => {
    it('should return empty array when no data in storage', () => {
      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('should load valid todos from storage', () => {
      const testTodos: Todo[] = [
        {
          id: 'test-1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: 'test-2',
          title: 'Test Todo 2',
          description: 'Test Description 2',
          completed: true,
          createdAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ];

      mockSessionStorage.store.todos = JSON.stringify(testTodos);

      const result = loadTodos();
      expect(result).toEqual(testTodos);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
    });

    it('should handle corrupt JSON and clear storage', () => {
      mockSessionStorage.store.todos = '{ invalid json }';

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to load todos from sessionStorage:',
        expect.any(Error)
      );
    });

    it('should handle invalid todo structure and clear storage', () => {
      // Missing required fields
      const invalidTodos = [
        { id: 'test-1', title: 'Test' }, // missing description, completed, createdAt
      ];

      mockSessionStorage.store.todos = JSON.stringify(invalidTodos);

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Invalid todos data found in sessionStorage, clearing storage'
      );
    });

    it('should handle non-array data and clear storage', () => {
      mockSessionStorage.store.todos = JSON.stringify({ not: 'an array' });

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Invalid todos data found in sessionStorage, clearing storage'
      );
    });

    it('should handle invalid Date objects', () => {
      const todosWithInvalidDate = [
        {
          id: 'test-1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: 'not a date', // Invalid date
        },
      ];

      mockSessionStorage.store.todos = JSON.stringify(todosWithInvalidDate);

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Invalid todos data found in sessionStorage, clearing storage'
      );
    });
  });

  describe('saveTodos', () => {
    it('should save todos successfully', () => {
      const testTodos: Todo[] = [
        {
          id: 'test-1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ];

      const result = saveTodos(testTodos);
      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', JSON.stringify(testTodos));
    });

    it('should handle QuotaExceededError', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      mockSessionStorage.setItem.mockImplementationOnce(() => {
        throw quotaError;
      });

      const testTodos: Todo[] = [
        {
          id: 'test-1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      const result = saveTodos(testTodos);
      expect(result).toBe(false);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Storage quota exceeded - todos not saved:',
        quotaError
      );
    });

    it('should handle other storage errors', () => {
      const genericError = new Error('Storage error');
      mockSessionStorage.setItem.mockImplementationOnce(() => {
        throw genericError;
      });

      const testTodos: Todo[] = [
        {
          id: 'test-1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      const result = saveTodos(testTodos);
      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to save todos to sessionStorage:',
        genericError
      );
    });

    it('should save empty array', () => {
      const result = saveTodos([]);
      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', '[]');
    });
  });

  describe('clearTodos', () => {
    it('should clear todos from storage', () => {
      clearTodos();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
    });

    it('should handle clear errors gracefully', () => {
      const clearError = new Error('Clear error');
      mockSessionStorage.removeItem.mockImplementationOnce(() => {
        throw clearError;
      });

      clearTodos();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to clear todos from sessionStorage:',
        clearError
      );
    });
  });

  describe('Date serialization/deserialization', () => {
    it('should properly serialize and deserialize Date objects', () => {
      const testDate = new Date('2024-01-01T12:00:00.000Z');
      const testTodos: Todo[] = [
        {
          id: 'test-1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: testDate,
        },
      ];

      // Save and then load
      saveTodos(testTodos);
      const loadedTodos = loadTodos();

      expect(loadedTodos).toHaveLength(1);
      expect(loadedTodos[0].createdAt).toBeInstanceOf(Date);
      expect(loadedTodos[0].createdAt.getTime()).toBe(testDate.getTime());
    });
  });
});
