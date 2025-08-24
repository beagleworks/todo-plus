import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Task, Category, Settings, UIState, UpdateTaskInput } from '../types';
import { useTaskStorage, useCategoryStorage, useSettingsStorage } from '../hooks/useStorage';

// アプリケーション状態の型定義
interface AppState {
  tasks: Task[];
  categories: Category[];
  settings: Settings;
  ui: UIState;
}

// アクション型定義
type AppAction = 
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: UpdateTaskInput } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK_STATUS'; payload: { id: string; status: Task['status']; completionComment?: string } }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_UI_STATE'; payload: Partial<UIState> }
  | { type: 'OPEN_TASK_FORM'; payload?: Task }
  | { type: 'CLOSE_TASK_FORM' }
  | { type: 'OPEN_CATEGORY_MANAGER' }
  | { type: 'CLOSE_CATEGORY_MANAGER' }
  | { type: 'SET_FILTER'; payload: Partial<UIState['filter']> };

// 初期状態
const initialUIState: UIState = {
  isTaskFormOpen: false,
  isCategoryManagerOpen: false,
  editingTask: null,
  filter: {
    status: 'all',
    category: 'all',
    priority: 'all',
    searchQuery: ''
  }
};

const initialState: AppState = {
  tasks: [],
  categories: [],
  settings: {
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
  },
  ui: initialUIState
};

// Reducer関数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date() }
            : task
        )
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };

    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };

    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? {
                ...task,
                status: action.payload.status,
                completionComment: action.payload.status === 'completed' 
                  ? action.payload.completionComment || '' 
                  : task.completionComment,
                completedAt: action.payload.status === 'completed' ? new Date() : null,
                updatedAt: new Date()
              }
            : task
        )
      };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case 'SET_UI_STATE':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };

    case 'OPEN_TASK_FORM':
      return {
        ...state,
        ui: {
          ...state.ui,
          isTaskFormOpen: true,
          editingTask: action.payload || null
        }
      };

    case 'CLOSE_TASK_FORM':
      return {
        ...state,
        ui: {
          ...state.ui,
          isTaskFormOpen: false,
          editingTask: null
        }
      };

    case 'OPEN_CATEGORY_MANAGER':
      return {
        ...state,
        ui: { ...state.ui, isCategoryManagerOpen: true }
      };

    case 'CLOSE_CATEGORY_MANAGER':
      return {
        ...state,
        ui: { ...state.ui, isCategoryManagerOpen: false }
      };

    case 'SET_FILTER':
      return {
        ...state,
        ui: {
          ...state.ui,
          filter: { ...state.ui.filter, ...action.payload }
        }
      };

    default:
      return state;
  }
}

// Context作成
interface TodoContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Provider コンポーネント
interface TodoProviderProps {
  children: React.ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Storage hooks
  const { tasks } = useTaskStorage();
  const { categories } = useCategoryStorage();
  const { settings } = useSettingsStorage();

  // 初期データの読み込み
  useEffect(() => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, [tasks]);

  useEffect(() => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  }, [categories]);

  useEffect(() => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, [settings]);

  // カテゴリーのタスク数を更新
  useEffect(() => {
    const updatedCategories = state.categories.map(category => {
      const taskCount = state.tasks.filter(task => task.category === category.id).length;
      return { ...category, taskCount };
    });
    
    // カテゴリーの変更があった場合のみ更新
    const hasChanges = updatedCategories.some((category, index) => 
      category.taskCount !== state.categories[index]?.taskCount
    );
    
    if (hasChanges) {
      dispatch({ type: 'SET_CATEGORIES', payload: updatedCategories });
    }
  }, [state.tasks, state.categories]);

  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
};

// Context使用用のカスタムHook
export const useTodoContext = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
};