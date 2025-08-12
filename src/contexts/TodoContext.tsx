import React, { useState, useEffect } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { TodoContext } from './TodoContextType';
import { loadTodos, saveTodos } from '../utils/sessionStorage';
import { Toast } from '../components/Toast';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Hydrate initial state from sessionStorage
    return loadTodos();
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addTodo = (title: string, description: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
    };
    setTodos([...todos, newTodo]);
  };

  const editTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Persist todos to sessionStorage whenever they change
  useEffect(() => {
    const saveSuccess = saveTodos(todos);
    if (!saveSuccess) {
      setToastMessage('Storage quota exceeded – your latest changes may not be saved.');
    }
  }, [todos]);

  return (
    <>
      <TodoContext.Provider value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo }}>
        {children}
      </TodoContext.Provider>
      {toastMessage && (
        <Toast message={toastMessage} type="warning" onClose={() => setToastMessage(null)} />
      )}
    </>
  );
};

// No re-exports to avoid react-refresh/only-export-components error
