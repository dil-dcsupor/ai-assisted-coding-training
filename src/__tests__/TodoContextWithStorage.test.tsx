import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import { useTodo } from '../hooks/useTodo';
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

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock console methods
const consoleSpy = {
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Test component that uses the Todo context
const TestComponent = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo } = useTodo();

  return (
    <div>
      <div data-testid="todo-count">{todos.length}</div>
      <div data-testid="todo-list">
        {todos.map(todo => (
          <div key={todo.id} data-testid={`todo-${todo.id}`}>
            <span>{todo.title}</span>
            <span>{todo.completed ? 'completed' : 'incomplete'}</span>
            <button onClick={() => toggleTodoCompletion(todo.id)}>Toggle</button>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </div>
        ))}
      </div>
      <button onClick={() => addTodo('New Todo', 'New Description')}>Add Todo</button>
    </div>
  );
};

describe('TodoContext with sessionStorage integration', () => {
  beforeEach(() => {
    // Reset mocks
    Object.keys(mockSessionStorage.store).forEach(key => delete mockSessionStorage.store[key]);
    vi.clearAllMocks();
  });

  it('should hydrate todos from sessionStorage on initialization', () => {
    const existingTodos: Todo[] = [
      {
        id: 'existing-1',
        title: 'Existing Todo',
        description: 'Existing Description',
        completed: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];

    mockSessionStorage.store.todos = JSON.stringify(existingTodos);

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    expect(screen.getByTestId('todo-existing-1')).toBeInTheDocument();
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
  });

  it('should start with empty todos when no storage data', () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(screen.getByTestId('todo-count')).toHaveTextContent('0');
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
  });

  it('should persist todos to sessionStorage when adding new todo', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const addButton = screen.getByText('Add Todo');
    await user.click(addButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'todos',
      expect.stringContaining('New Todo')
    );
  });

  it('should persist todos when toggling completion', async () => {
    const user = userEvent.setup();
    const existingTodos: Todo[] = [
      {
        id: 'test-1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];

    mockSessionStorage.store.todos = JSON.stringify(existingTodos);

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const toggleButton = screen.getByText('Toggle');
    await user.click(toggleButton);

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'todos',
      expect.stringContaining('"completed":true')
    );
  });

  it('should persist todos when deleting', async () => {
    const user = userEvent.setup();
    const existingTodos: Todo[] = [
      {
        id: 'test-1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];

    mockSessionStorage.store.todos = JSON.stringify(existingTodos);

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('0');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', '[]');
  });

  it('should show toast when storage quota is exceeded', async () => {
    const user = userEvent.setup();
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');

    // First call succeeds (initial render), second call fails (after adding todo)
    mockSessionStorage.setItem
      .mockImplementationOnce(() => {}) // Initial render success
      .mockImplementationOnce(() => {
        throw quotaError;
      }); // Add todo fails

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const addButton = screen.getByText('Add Todo');
    await user.click(addButton);

    // Toast should appear
    expect(
      screen.getByText('Storage quota exceeded – your latest changes may not be saved.')
    ).toBeInTheDocument();
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      'Storage quota exceeded - todos not saved:',
      quotaError
    );
  });

  it('should dismiss toast when close button is clicked', async () => {
    const user = userEvent.setup();
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');

    mockSessionStorage.setItem
      .mockImplementationOnce(() => {}) // Initial render success
      .mockImplementationOnce(() => {
        throw quotaError;
      }); // Add todo fails

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const addButton = screen.getByText('Add Todo');
    await user.click(addButton);

    // Toast should appear
    const toastMessage = screen.getByText(
      'Storage quota exceeded – your latest changes may not be saved.'
    );
    expect(toastMessage).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    // Toast should disappear
    expect(toastMessage).not.toBeInTheDocument();
  });

  it('should handle corrupt sessionStorage data gracefully', () => {
    mockSessionStorage.store.todos = '{ invalid json }';

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    // Should start with empty todos and not crash
    expect(screen.getByTestId('todo-count')).toHaveTextContent('0');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      'Failed to load todos from sessionStorage:',
      expect.any(Error)
    );
  });

  it('should continue working after storage errors', async () => {
    const user = userEvent.setup();
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');

    // All setItem calls fail
    mockSessionStorage.setItem.mockImplementation(() => {
      throw quotaError;
    });

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    // Should still be able to add todos (in memory)
    const addButton = screen.getByText('Add Todo');
    await user.click(addButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    expect(screen.getByText('New Todo')).toBeInTheDocument();
  });
});
