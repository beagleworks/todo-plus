import React, { useState, useCallback } from 'react';
import type { Category, ValidationErrors } from '../../types';
import { useCategories } from '../../hooks/useTasks';
import styles from './CategoryManager.module.css';

interface CategoryManagerProps {
  onClose: () => void;
}

interface CategoryFormData {
  name: string;
  color: string;
  description: string;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: '#3742fa',
    description: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // プリセットカラー
  const presetColors = [
    '#3742fa', '#ff4757', '#26de81', '#ffa502',
    '#a4b0be', '#ff6b81', '#7bed9f', '#70a1ff',
    '#5352ed', '#ff3838', '#2ed573', '#ff9f43',
    '#57606f', '#ff6348', '#2ed573', '#ffa502'
  ];

  // バリデーション
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.title = 'カテゴリー名は必須です';
    } else if (formData.name.length > 50) {
      newErrors.title = 'カテゴリー名は50文字以内で入力してください';
    }

    // 重複チェック（編集時は自分自身を除く）
    const isDuplicate = categories.some(category => 
      category.name === formData.name.trim() && 
      category.id !== editingCategory?.id
    );
    
    if (isDuplicate) {
      newErrors.title = 'このカテゴリー名は既に使用されています';
    }

    if (formData.description.length > 200) {
      newErrors.description = '説明は200文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, categories, editingCategory]);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryData = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim()
      };

      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          ...categoryData
        });
      } else {
        await addCategory(categoryData);
      }

      // フォームをリセット
      setFormData({ name: '', color: '#3742fa', description: '' });
      setEditingCategory(null);
      setErrors({});
    } catch (error) {
      console.error('カテゴリーの保存に失敗しました:', error);
      alert('カテゴリーの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 編集開始
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || ''
    });
    setErrors({});
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', color: '#3742fa', description: '' });
    setErrors({});
  };

  // 削除
  const handleDelete = async (category: Category) => {
    if (category.id === 'default') {
      alert('デフォルトカテゴリーは削除できません');
      return;
    }

    const confirmMessage = category.taskCount > 0 
      ? `「${category.name}」を削除しますか？\n関連する${category.taskCount}件のタスクは「未分類」カテゴリーに移動されます。`
      : `「${category.name}」を削除しますか？`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error('カテゴリーの削除に失敗しました:', error);
        alert('カテゴリーの削除に失敗しました。もう一度お試しください。');
      }
    }
  };

  // フォーム項目の変更ハンドラー
  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (field === 'name' && errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    } else if (field === 'description' && errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  // カラー選択ハンドラー
  const handleColorSelect = (color: string) => {
    handleInputChange('color', color);
  };

  // モーダルの外側クリックで閉じる
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modal} onClick={handleModalClick}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>カテゴリー管理</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* 既存カテゴリー一覧 */}
        <div className={styles.categoryList}>
          {categories.length === 0 ? (
            <div className={styles.emptyState}>
              <p>カテゴリーがありません</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className={styles.categoryItem}>
                <div className={styles.categoryInfo}>
                  <div
                    className={styles.categoryColor}
                    style={{ backgroundColor: category.color }}
                    title={`カラー: ${category.color}`}
                  />
                  <div className={styles.categoryDetails}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    {category.description && (
                      <p className={styles.categoryDescription}>{category.description}</p>
                    )}
                  </div>
                  <div className={styles.categoryStats}>
                    <span className={styles.taskCount}>
                      {category.taskCount}件のタスク
                    </span>
                  </div>
                </div>
                <div className={styles.categoryActions}>
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(category)}
                    title="編集"
                  >
                    ✏️ 編集
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(category)}
                    disabled={category.id === 'default'}
                    title={category.id === 'default' ? 'デフォルトカテゴリーは削除できません' : '削除'}
                  >
                    🗑️ 削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 新規作成・編集フォーム */}
        <div className={styles.addCategorySection}>
          <h3 className={styles.sectionTitle}>
            {editingCategory ? 'カテゴリーを編集' : '新しいカテゴリーを作成'}
          </h3>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* カテゴリー名 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                カテゴリー名 <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例: 仕事, プライベート, 趣味"
                maxLength={50}
                required
              />
              {errors.title && <div className={styles.error}>{errors.title}</div>}
            </div>

            {/* カラー選択 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>カラー</label>
              <div className={styles.colorPickerGroup}>
                <input
                  type="color"
                  className={styles.colorPicker}
                  value={formData.color}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  title="カスタムカラーを選択"
                />
                <div className={styles.presetColors}>
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.presetColor} ${
                        formData.color === color ? styles.selected : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={`プリセットカラー: ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 説明 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>説明</label>
              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="カテゴリーの説明を入力してください（任意）"
                maxLength={200}
                rows={3}
              />
              {errors.description && <div className={styles.error}>{errors.description}</div>}
            </div>

            {/* ボタン */}
            <div className={styles.buttonGroup}>
              {editingCategory && (
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
              )}
              <button
                type="submit"
                className={`${styles.button} ${styles.primaryButton}`}
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting 
                  ? '保存中...' 
                  : editingCategory 
                    ? 'カテゴリーを更新' 
                    : 'カテゴリーを作成'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;