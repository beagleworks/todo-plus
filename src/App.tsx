import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TodoProvider } from './context/TodoContext';
import { useTasks, useCategories, useUI, useFilteredTasks } from './hooks/useTasks';
import { useTwitterShare } from './hooks/useTwitterShare';
import TaskForm from './components/TaskForm/TaskForm';
import TaskItem from './components/TaskItem/TaskItem';
import CategoryManager from './components/CategoryManager/CategoryManager';
import type { Task } from './types';
import './App.css';

// メインコンテンツコンポーネント
const TodoContent: React.FC = () => {
  const { addTask, reorderTaskList } = useTasks();
  const { categories } = useCategories();
  const { ui, openTaskForm, closeTaskForm, setFilter, openCategoryManager, closeCategoryManager } = useUI();
  const { filteredTasks, totalTasks, completedTasks, inProgressTasks, todoTasks } = useFilteredTasks();
  const { shareTask } = useTwitterShare();

  // ドラッグアンドドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ドラッグ終了ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex(task => task.id === active.id);
      const newIndex = filteredTasks.findIndex(task => task.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
        await reorderTaskList(reorderedTasks);
      }
    }
  };

  // サンプルタスクの追加
  const handleAddSampleTask = async () => {
    await addTask({
      title: 'サンプルタスク',
      description: 'これはサンプルのタスクです。編集や削除ができます。',
      priority: 'medium',
      category: 'default',
      status: 'todo',
      completionComment: '',
      tags: ['サンプル', 'テスト']
    });
  };

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="header">
        <h1>📝 Todo Plus</h1>
        <p>高機能タスク管理アプリ</p>
      </header>

      {/* 統計情報 */}
      <div className="stats">
        <div className="stat-item">
          <span className="stat-number">{totalTasks}</span>
          <span className="stat-label">総タスク数</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{todoTasks}</span>
          <span className="stat-label">未実行</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{inProgressTasks}</span>
          <span className="stat-label">実行中</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{completedTasks}</span>
          <span className="stat-label">完了</span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="action-buttons">
        <button 
          className="btn btn-primary"
          onClick={() => openTaskForm()}
        >
          ➕ 新しいタスク
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => openCategoryManager()}
        >
          📁 カテゴリー管理
        </button>
        <button 
          className="btn btn-secondary"
          onClick={handleAddSampleTask}
        >
          🔧 サンプルタスク追加
        </button>
      </div>

      {/* フィルター */}
      <div className="filters">
        <select 
          value={ui.filter.status} 
          onChange={(e) => setFilter({ status: e.target.value as Task['status'] | 'all' })}
          className="filter-select"
        >
          <option value="all">すべてのステータス</option>
          <option value="todo">未実行</option>
          <option value="in-progress">実行中</option>
          <option value="completed">完了</option>
        </select>
        
        <select 
          value={ui.filter.category} 
          onChange={(e) => setFilter({ category: e.target.value })}
          className="filter-select"
        >
          <option value="all">すべてのカテゴリー</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="タスクを検索..."
          value={ui.filter.searchQuery}
          onChange={(e) => setFilter({ searchQuery: e.target.value })}
          className="search-input"
        />
      </div>

      {/* タスクリスト */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>📝 タスクがありません</p>
              <p>新しいタスクを作成してみましょう！</p>
            </div>
          ) : (
            <SortableContext 
              items={filteredTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onShare={shareTask}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>

      {/* タスクフォームモーダル */}
      {ui.isTaskFormOpen && (
        <TaskForm 
          task={ui.editingTask}
          onClose={closeTaskForm}
        />
      )}

      {/* カテゴリー管理モーダル */}
      {ui.isCategoryManagerOpen && (
        <CategoryManager 
          onClose={closeCategoryManager}
        />
      )}
    </div>
  );
};

// メインAppコンポーネント
function App() {
  return (
    <TodoProvider>
      <TodoContent />
    </TodoProvider>
  );
}

export default App
