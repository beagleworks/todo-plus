import { useState, useCallback } from 'react';
import type { Task, Category, Settings } from '../types';

// 汎用LocalStorageカスタムHook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setStoredValue] as const;
};

// タスク用LocalStorageカスタムHook
export const useTaskStorage = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('todo-tasks', []);

  const saveTask = useCallback((task: Task) => {
    setTasks(currentTasks => {
      const existingIndex = currentTasks.findIndex(t => t.id === task.id);
      if (existingIndex >= 0) {
        // 既存のタスクを更新
        const updatedTasks = [...currentTasks];
        updatedTasks[existingIndex] = { ...task, updatedAt: new Date() };
        return updatedTasks;
      } else {
        // 新しいタスクを追加
        return [...currentTasks, task];
      }
    });
  }, [setTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
  }, [setTasks]);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status'], completionComment = '') => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId 
          ? {
              ...task,
              status,
              completionComment: status === 'completed' ? completionComment : task.completionComment,
              completedAt: status === 'completed' ? new Date() : null,
              updatedAt: new Date()
            }
          : task
      )
    );
  }, [setTasks]);

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
      updatedAt: new Date()
    }));
    setTasks(tasksWithNewOrder);
  }, [setTasks]);

  return {
    tasks,
    saveTask,
    deleteTask,
    updateTaskStatus,
    reorderTasks,
    setTasks
  };
};

// カテゴリー用LocalStorageカスタムHook
export const useCategoryStorage = () => {
  const [categories, setCategories] = useLocalStorage<Category[]>('todo-categories', [
    // デフォルトカテゴリー
    {
      id: 'default',
      name: '未分類',
      color: '#a4b0be',
      description: 'デフォルトカテゴリー',
      createdAt: new Date(),
      taskCount: 0
    }
  ]);

  const saveCategory = useCallback((category: Category) => {
    setCategories(currentCategories => {
      const existingIndex = currentCategories.findIndex(c => c.id === category.id);
      if (existingIndex >= 0) {
        // 既存のカテゴリーを更新
        const updatedCategories = [...currentCategories];
        updatedCategories[existingIndex] = category;
        return updatedCategories;
      } else {
        // 新しいカテゴリーを追加
        return [...currentCategories, category];
      }
    });
  }, [setCategories]);

  const deleteCategory = useCallback((categoryId: string) => {
    // デフォルトカテゴリーは削除不可
    if (categoryId === 'default') {
      console.warn('デフォルトカテゴリーは削除できません');
      return;
    }
    setCategories(currentCategories => 
      currentCategories.filter(category => category.id !== categoryId)
    );
  }, [setCategories]);

  const updateCategoryTaskCount = useCallback((categoryId: string, taskCount: number) => {
    setCategories(currentCategories =>
      currentCategories.map(category =>
        category.id === categoryId
          ? { ...category, taskCount }
          : category
      )
    );
  }, [setCategories]);

  const getCategoryById = useCallback((categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  }, [categories]);

  return {
    categories,
    saveCategory,
    deleteCategory,
    updateCategoryTaskCount,
    getCategoryById,
    setCategories
  };
};

// 設定用LocalStorageカスタムHook
export const useSettingsStorage = () => {
  const defaultSettings: Settings = {
    theme: 'light',
    defaultPriority: 'medium',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    showCompleted: true,
    autoSave: true,
    notifications: {
      enabled: false,
      reminderTime: 60
    }
  };

  const [settings, setSettings] = useLocalStorage<Settings>('todo-settings', defaultSettings);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(currentSettings => ({
      ...currentSettings,
      ...newSettings
    }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings]);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};

// データエクスポート・インポート用Hook
export const useDataManagement = () => {
  const exportData = useCallback(() => {
    try {
      const tasks = JSON.parse(localStorage.getItem('todo-tasks') || '[]');
      const categories = JSON.parse(localStorage.getItem('todo-categories') || '[]');
      const settings = JSON.parse(localStorage.getItem('todo-settings') || '{}');

      const exportData = {
        tasks,
        categories,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('エクスポートエラー:', error);
      throw new Error('データのエクスポートに失敗しました');
    }
  }, []);

  const importData = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target?.result as string);
          
          // データ形式の検証
          if (!importData.tasks || !Array.isArray(importData.tasks)) {
            throw new Error('無効なデータ形式です');
          }

          // データをLocalStorageに保存
          localStorage.setItem('todo-tasks', JSON.stringify(importData.tasks));
          localStorage.setItem('todo-categories', JSON.stringify(importData.categories || []));
          localStorage.setItem('todo-settings', JSON.stringify(importData.settings || {}));
          
          // ページをリロードして反映
          window.location.reload();
          resolve();
        } catch (error) {
          console.error('インポートエラー:', error);
          reject(new Error('データのインポートに失敗しました'));
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.removeItem('todo-tasks');
    localStorage.removeItem('todo-categories');
    localStorage.removeItem('todo-settings');
    window.location.reload();
  }, []);

  return {
    exportData,
    importData,
    clearAllData
  };
};