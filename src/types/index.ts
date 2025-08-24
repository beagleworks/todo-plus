// Todo管理アプリの型定義

// タスクデータモデル
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'todo' | 'in-progress' | 'completed';
  completionComment: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  order: number;
  tags: string[];
}

// Task作成用の型
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'order'>;
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt'>>;

// カテゴリーデータモデル
export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  taskCount: number;
}

// Category作成用の型
export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'taskCount'>;

// 設定データモデル
export interface Settings {
  theme: 'light' | 'dark';
  defaultPriority: Task['priority'];
  sortBy: 'createdAt' | 'priority' | 'title' | 'dueDate';
  sortOrder: 'asc' | 'desc';
  showCompleted: boolean;
  autoSave: boolean;
  notifications: {
    enabled: boolean;
    reminderTime: number; // minutes
  };
}

// デフォルト設定
export const defaultSettings: Settings = {
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

// UI関連の型定義
export interface UIState {
  isTaskFormOpen: boolean;
  isCategoryManagerOpen: boolean;
  editingTask: Task | null;
  filter: {
    status: Task['status'] | 'all';
    category: string | 'all';
    priority: Task['priority'] | 'all';
    searchQuery: string;
  };
}

// フォーム用型定義
export interface TaskFormData {
  title: string;
  description: string;
  priority: Task['priority'];
  category: string;
  tags: string[];
}

export interface ValidationErrors {
  title?: string;
  description?: string;
  category?: string;
}

// ドラッグアンドドロップ用型定義
export interface DragEndEvent {
  active: { id: string };
  over: { id: string } | null;
}

// Task作成関数
export const createTask = (input: CreateTaskInput): Task => ({
  ...input,
  id: crypto.randomUUID(),
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  order: Date.now()
});

// Category作成関数
export const createCategory = (input: CreateCategoryInput): Category => ({
  ...input,
  id: crypto.randomUUID(),
  createdAt: new Date(),
  taskCount: 0
});

// 優先度の表示用設定
export const priorityConfig = {
  high: { label: '高', color: '#ff4757', emoji: '🔴' },
  medium: { label: '中', color: '#ffa502', emoji: '🟡' },
  low: { label: '低', color: '#26de81', emoji: '🟢' }
} as const;

// ステータスの表示用設定
export const statusConfig = {
  todo: { label: '未実行', color: '#a4b0be', emoji: '📝' },
  'in-progress': { label: '実行中', color: '#3742fa', emoji: '⚡' },
  completed: { label: '完了', color: '#2ed573', emoji: '✅' }
} as const;