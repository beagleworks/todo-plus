import { useCallback, useMemo } from 'react';
import { useTodoContext } from '../context/TodoContext';
import { useTaskStorage, useCategoryStorage } from './useStorage';
import { createTask } from '../types';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

// タスク操作用カスタムHook
export const useTasks = () => {
  const { state, dispatch } = useTodoContext();
  const { saveTask, deleteTask: deleteTaskFromStorage, updateTaskStatus: updateTaskStatusInStorage, reorderTasks } = useTaskStorage();

  // タスク作成
  const addTask = useCallback(async (input: CreateTaskInput) => {
    try {
      const newTask = createTask(input);
      
      // LocalStorageに保存
      saveTask(newTask);
      
      // グローバル状態を更新
      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      return newTask;
    } catch (error) {
      console.error('タスクの作成に失敗しました:', error);
      throw error;
    }
  }, [saveTask, dispatch]);

  // タスク更新
  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput) => {
    try {
      // グローバル状態を更新
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
      
      // 更新されたタスクを取得してLocalStorageに保存
      const updatedTask = state.tasks.find(task => task.id === id);
      if (updatedTask) {
        saveTask({ ...updatedTask, ...updates, updatedAt: new Date() });
      }
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      throw error;
    }
  }, [dispatch, state.tasks, saveTask]);

  // タスク削除
  const deleteTask = useCallback(async (id: string) => {
    try {
      // LocalStorageから削除
      deleteTaskFromStorage(id);
      
      // グローバル状態を更新
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('タスクの削除に失敗しました:', error);
      throw error;
    }
  }, [deleteTaskFromStorage, dispatch]);

  // タスクステータス更新
  const updateTaskStatus = useCallback(async (id: string, status: Task['status'], completionComment = '') => {
    try {
      // LocalStorageでステータス更新
      updateTaskStatusInStorage(id, status, completionComment);
      
      // グローバル状態を更新
      dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id, status, completionComment } });
    } catch (error) {
      console.error('タスクステータスの更新に失敗しました:', error);
      throw error;
    }
  }, [updateTaskStatusInStorage, dispatch]);

  // タスク並び替え
  const reorderTaskList = useCallback(async (reorderedTasks: Task[]) => {
    try {
      // LocalStorageで並び替え
      reorderTasks(reorderedTasks);
      
      // グローバル状態を更新
      dispatch({ type: 'REORDER_TASKS', payload: reorderedTasks });
    } catch (error) {
      console.error('タスクの並び替えに失敗しました:', error);
      throw error;
    }
  }, [reorderTasks, dispatch]);

  return {
    tasks: state.tasks,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reorderTaskList
  };
};

// フィルタリング・検索用カスタムHook
export const useFilteredTasks = () => {
  const { state } = useTodoContext();
  const { tasks } = state;
  const { filter } = state.ui;

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // ステータスでフィルタ
    if (filter.status !== 'all') {
      filtered = filtered.filter(task => task.status === filter.status);
    }

    // カテゴリーでフィルタ
    if (filter.category !== 'all') {
      filtered = filtered.filter(task => task.category === filter.category);
    }

    // 優先度でフィルタ
    if (filter.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filter.priority);
    }

    // 検索クエリでフィルタ
    if (filter.searchQuery.trim()) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 完了タスクの表示設定
    if (!state.settings.showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    // ソート
    filtered.sort((a, b) => {
      const { sortBy, sortOrder } = state.settings;
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        default:
          comparison = a.order - b.order;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, filter, state.settings]);

  return {
    filteredTasks,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    inProgressTasks: tasks.filter(task => task.status === 'in-progress').length,
    todoTasks: tasks.filter(task => task.status === 'todo').length
  };
};

// カテゴリー操作用カスタムHook
export const useCategories = () => {
  const { state, dispatch } = useTodoContext();
  const { saveCategory, deleteCategory: deleteCategoryFromStorage } = useCategoryStorage();

  // カテゴリー作成
  const addCategory = useCallback(async (categoryData: Omit<import('../types').Category, 'id' | 'createdAt' | 'taskCount'>) => {
    try {
      const newCategory: import('../types').Category = {
        ...categoryData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        taskCount: 0
      };
      
      // LocalStorageに保存
      saveCategory(newCategory);
      
      // グローバル状態を更新
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      
      return newCategory;
    } catch (error) {
      console.error('カテゴリーの作成に失敗しました:', error);
      throw error;
    }
  }, [saveCategory, dispatch]);

  // カテゴリー更新
  const updateCategory = useCallback(async (updatedCategory: import('../types').Category) => {
    try {
      // LocalStorageに保存
      saveCategory(updatedCategory);
      
      // グローバル状態を更新
      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    } catch (error) {
      console.error('カテゴリーの更新に失敗しました:', error);
      throw error;
    }
  }, [saveCategory, dispatch]);

  // カテゴリー削除
  const deleteCategory = useCallback(async (id: string) => {
    try {
      // デフォルトカテゴリーは削除不可
      if (id === 'default') {
        throw new Error('デフォルトカテゴリーは削除できません');
      }

      // 関連するタスクをデフォルトカテゴリーに移動
      const tasksToUpdate = state.tasks.filter(task => task.category === id);
      for (const task of tasksToUpdate) {
        dispatch({ type: 'UPDATE_TASK', payload: { id: task.id, updates: { category: 'default' } } });
      }

      // LocalStorageから削除
      deleteCategoryFromStorage(id);
      
      // グローバル状態を更新
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('カテゴリーの削除に失敗しました:', error);
      throw error;
    }
  }, [deleteCategoryFromStorage, dispatch, state.tasks]);

  return {
    categories: state.categories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};

// UI状態管理用カスタムHook
export const useUI = () => {
  const { state, dispatch } = useTodoContext();

  const openTaskForm = useCallback((task?: Task) => {
    dispatch({ type: 'OPEN_TASK_FORM', payload: task });
  }, [dispatch]);

  const closeTaskForm = useCallback(() => {
    dispatch({ type: 'CLOSE_TASK_FORM' });
  }, [dispatch]);

  const openCategoryManager = useCallback(() => {
    dispatch({ type: 'OPEN_CATEGORY_MANAGER' });
  }, [dispatch]);

  const closeCategoryManager = useCallback(() => {
    dispatch({ type: 'CLOSE_CATEGORY_MANAGER' });
  }, [dispatch]);

  const setFilter = useCallback((filterUpdates: Partial<import('../types').UIState['filter']>) => {
    dispatch({ type: 'SET_FILTER', payload: filterUpdates });
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    dispatch({ 
      type: 'SET_FILTER', 
      payload: { 
        status: 'all', 
        category: 'all', 
        priority: 'all', 
        searchQuery: '' 
      } 
    });
  }, [dispatch]);

  return {
    ui: state.ui,
    openTaskForm,
    closeTaskForm,
    openCategoryManager,
    closeCategoryManager,
    setFilter,
    clearFilters
  };
};