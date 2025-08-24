import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';
import { priorityConfig, statusConfig } from '../../types';
import { useTasks, useCategories, useUI } from '../../hooks/useTasks';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onShare?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onShare }) => {
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionComment, setCompletionComment] = useState('');
  
  const { updateTaskStatus, deleteTask } = useTasks();
  const { categories } = useCategories();
  const { openTaskForm } = useUI();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // カテゴリー情報を取得
  const category = categories.find(cat => cat.id === task.category);
  const categoryName = category?.name || '未分類';
  const categoryColor = category?.color || '#a4b0be';

  // ステータス変更ハンドラー
  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      if (newStatus === 'completed') {
        setShowCompletionForm(true);
      } else {
        await updateTaskStatus(task.id, newStatus);
      }
    } catch (error) {
      console.error('ステータス変更エラー:', error);
    }
  };

  // 完了処理
  const handleComplete = async () => {
    try {
      await updateTaskStatus(task.id, 'completed', completionComment);
      setShowCompletionForm(false);
      setCompletionComment('');
    } catch (error) {
      console.error('完了処理エラー:', error);
    }
  };

  // 編集ハンドラー
  const handleEdit = () => {
    openTaskForm(task);
  };

  // 削除ハンドラー
  const handleDelete = async () => {
    if (window.confirm('このタスクを削除しますか？')) {
      try {
        await deleteTask(task.id);
      } catch (error) {
        console.error('削除エラー:', error);
      }
    }
  };

  // 共有ハンドラー
  const handleShare = () => {
    if (onShare) {
      onShare(task);
    }
  };

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`${styles.taskItem} ${isDragging ? styles.dragging : ''}`}
    >
      {/* タスクヘッダー */}
      <div className={styles.taskHeader} {...listeners}>
        <h3 className={`${styles.taskTitle} ${task.status === 'completed' ? styles.completed : ''}`}>
          {task.title}
        </h3>
        <div className={styles.taskMeta}>
          <span className={`${styles.priorityBadge} ${styles[task.priority]}`}>
            {priorityConfig[task.priority].emoji} {priorityConfig[task.priority].label}
          </span>
          <span className={`${styles.statusIndicator} ${styles[task.status.replace('-', '')]}`}>
            {statusConfig[task.status].emoji} {statusConfig[task.status].label}
          </span>
        </div>
      </div>

      {/* タスク説明 */}
      {task.description && (
        <p className={`${styles.taskDescription} ${task.status === 'completed' ? styles.completed : ''}`}>
          {task.description}
        </p>
      )}

      {/* 完了時のコメント */}
      {task.status === 'completed' && task.completionComment && (
        <div className={styles.completionComment}>
          {task.completionComment}
        </div>
      )}

      {/* タスクフッター */}
      <div className={styles.taskFooter}>
        <div>
          {/* カテゴリータグ */}
          <span 
            className={styles.categoryTag}
            style={{ backgroundColor: categoryColor }}
          >
            📁 {categoryName}
          </span>
          
          {/* タグ表示 */}
          {task.tags.length > 0 && (
            <div className={styles.tags}>
              {task.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className={styles.actionButtons}>
          {task.status !== 'completed' && (
            <>
              <button
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.status === 'todo' ? 'in-progress' : 'completed');
                }}
                title={task.status === 'todo' ? '実行中にする' : '完了にする'}
              >
                {task.status === 'todo' ? '▶️ 開始' : '✅ 完了'}
              </button>
            </>
          )}
          
          <button
            className={`${styles.actionButton} ${styles.editButton}`}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            title="編集"
          >
            ✏️ 編集
          </button>
          
          <button
            className={`${styles.actionButton} ${styles.shareButton}`}
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            title="Xに共有"
          >
            🐦 共有
          </button>
          
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title="削除"
          >
            🗑️ 削除
          </button>
        </div>
      </div>

      {/* 完了時コメント入力フォーム */}
      {showCompletionForm && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            完了コメント（任意）:
          </label>
          <textarea
            value={completionComment}
            onChange={(e) => setCompletionComment(e.target.value)}
            placeholder="作業内容や成果についてコメントを記録できます..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '0.5rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#2ed573',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ✅ 完了
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCompletionForm(false);
              }}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#a4b0be',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* タイムスタンプ */}
      <div className={styles.timestamps}>
        作成: {formatDate(task.createdAt)}
        {task.completedAt && (
          <>
            {' | '}
            完了: {formatDate(task.completedAt)}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskItem;