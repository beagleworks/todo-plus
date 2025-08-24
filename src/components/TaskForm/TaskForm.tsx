import React, { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, TaskFormData, ValidationErrors } from '../../types';
import { priorityConfig } from '../../types';
import { useTasks, useCategories, useUI } from '../../hooks/useTasks';
import styles from './TaskForm.module.css';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose }) => {
  const { addTask, updateTask } = useTasks();
  const { categories } = useCategories();
  const { closeTaskForm } = useUI();
  
  const isEditing = !!task;

  // フォーム状態
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'default',
    tags: []
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // 編集時の初期値設定
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
        tags: [...task.tags]
      });
    }
  }, [task]);

  // バリデーション
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    if (formData.description.length > 500) {
      newErrors.description = '説明は500文字以内で入力してください';
    }

    if (!formData.category) {
      newErrors.category = 'カテゴリーを選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: CreateTaskInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
        status: 'todo',
        completionComment: '',
        tags: formData.tags
      };

      if (isEditing && task) {
        await updateTask(task.id, taskData);
      } else {
        await addTask(taskData);
      }

      closeTaskForm();
    } catch (error) {
      console.error('タスクの保存に失敗しました:', error);
      alert('タスクの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // フォーム項目の変更ハンドラー
  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (field === 'title' && errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    } else if (field === 'description' && errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    } else if (field === 'category' && errors.category) {
      setErrors(prev => ({ ...prev, category: undefined }));
    }
  };

  // 優先度選択ハンドラー
  const handlePrioritySelect = (priority: Task['priority']) => {
    setFormData(prev => ({ ...prev, priority }));
  };

  // タグ追加ハンドラー
  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      
      if (newTag && !formData.tags.includes(newTag) && formData.tags.length < 10) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        setTagInput('');
      }
    }
  };

  // タグ削除ハンドラー
  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // モーダルの外側クリックで閉じる
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 選択されたカテゴリー情報
  const selectedCategory = categories.find(cat => cat.id === formData.category);

  return (
    <div className={styles.modal} onClick={handleModalClick}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'タスクを編集' : '新しいタスクを作成'}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* タイトル */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              タイトル <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="例: プレゼン資料の作成"
              maxLength={100}
              required
            />
            {errors.title && <div className={styles.error}>{errors.title}</div>}
          </div>

          {/* 説明 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>説明</label>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="タスクの詳細な説明を入力してください..."
              maxLength={500}
              rows={4}
            />
            {errors.description && <div className={styles.error}>{errors.description}</div>}
          </div>

          {/* 優先度 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>優先度</label>
            <div className={styles.prioritySelector}>
              {(Object.keys(priorityConfig) as Array<keyof typeof priorityConfig>).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`${styles.priorityOption} ${styles[priority]} ${
                    formData.priority === priority ? styles.selected : ''
                  }`}
                  onClick={() => handlePrioritySelect(priority)}
                >
                  <span>{priorityConfig[priority].emoji}</span>
                  <span className={styles.priorityLabel}>{priorityConfig[priority].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリー */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              カテゴリー <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className={styles.categoryInfo}>
                <div
                  className={styles.categoryColor}
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span className={styles.categoryName}>
                  {selectedCategory.description}
                </span>
              </div>
            )}
            {errors.category && <div className={styles.error}>{errors.category}</div>}
          </div>

          {/* タグ */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              タグ <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                (Enterまたはカンマで追加、最大10個)
              </span>
            </label>
            <div className={styles.tagsInput}>
              <div className={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    #{tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => handleTagRemove(tag)}
                      aria-label={`${tag}タグを削除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className={styles.tagInput}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  placeholder={formData.tags.length === 0 ? "例: 重要, 急ぎ, 会議" : ""}
                  disabled={formData.tags.length >= 10}
                />
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting 
                ? '保存中...' 
                : isEditing 
                  ? 'タスクを更新' 
                  : 'タスクを作成'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;