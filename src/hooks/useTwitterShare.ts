import { useCallback } from 'react';
import type { Task } from '../types';
import { statusConfig } from '../types';

// X投稿機能のカスタムHook
export const useTwitterShare = () => {
  // タスクを共有用テキストにフォーマット
  const formatTaskForShare = useCallback((task: Task): string => {
    const statusEmoji = statusConfig[task.status].emoji;
    const statusText = statusConfig[task.status].label;
    
    // 基本的な投稿テキスト
    let text = `${statusEmoji} ${task.title} - ${statusText}`;
    
    // タグがある場合は追加
    if (task.tags.length > 0) {
      const hashtags = task.tags.map(tag => `#${tag}`).join(' ');
      text += `\n\n${hashtags}`;
    }
    
    // 完了時のコメントがある場合は追加
    if (task.status === 'completed' && task.completionComment) {
      text += `\n\n💭 ${task.completionComment}`;
    }
    
    // アプリのハッシュタグを追加
    text += ' #TodoApp #生産性向上';
    
    return text;
  }, []);

  // 進捗報告用テキストをフォーマット
  const formatProgressReport = useCallback((
    totalTasks: number,
    completedTasks: number,
    inProgressTasks: number
  ): string => {
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return `📊 今日の進捗報告
✅ 完了: ${completedTasks}件
⚡ 実行中: ${inProgressTasks}件
📝 全体: ${totalTasks}件
🎯 達成率: ${completionRate}%

#TodoApp #生産性向上 #進捗報告`;
  }, []);

  // カスタムメッセージで投稿用テキストをフォーマット
  const formatCustomMessage = useCallback((message: string, includeHashtags = true): string => {
    let text = message;
    
    if (includeHashtags) {
      text += '\n\n#TodoApp #生産性向上';
    }
    
    return text;
  }, []);

  // X投稿を開く
  const shareToTwitter = useCallback((text: string) => {
    try {
      // テキストの長さをチェック（Xの文字数制限を考慮）
      if (text.length > 280) {
        console.warn('投稿テキストが280文字を超えています。切り詰められる可能性があります。');
      }
      
      const encodedText = encodeURIComponent(text);
      const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
      
      // ポップアップウィンドウで開く
      const popup = window.open(
        url,
        'twitter-share',
        'width=600,height=400,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        // ポップアップがブロックされた場合は新しいタブで開く
        window.open(url, '_blank');
      }
      
      return true;
    } catch (error) {
      console.error('X投稿エラー:', error);
      return false;
    }
  }, []);

  // タスクを共有
  const shareTask = useCallback((task: Task) => {
    const text = formatTaskForShare(task);
    return shareToTwitter(text);
  }, [formatTaskForShare, shareToTwitter]);

  // 進捗を共有
  const shareProgress = useCallback((
    totalTasks: number,
    completedTasks: number,
    inProgressTasks: number
  ) => {
    const text = formatProgressReport(totalTasks, completedTasks, inProgressTasks);
    return shareToTwitter(text);
  }, [formatProgressReport, shareToTwitter]);

  // カスタムメッセージを共有
  const shareCustomMessage = useCallback((message: string, includeHashtags = true) => {
    const text = formatCustomMessage(message, includeHashtags);
    return shareToTwitter(text);
  }, [formatCustomMessage, shareToTwitter]);

  // 投稿プレビューを生成
  const getSharePreview = useCallback((task: Task): { text: string; characterCount: number } => {
    const text = formatTaskForShare(task);
    return {
      text,
      characterCount: text.length
    };
  }, [formatTaskForShare]);

  // 複数タスクの達成報告
  const shareMultipleTasksCompletion = useCallback((completedTasks: Task[]) => {
    if (completedTasks.length === 0) {
      return false;
    }

    let text = `🎉 ${completedTasks.length}件のタスクを完了しました！\n\n`;
    
    // 最初の3つのタスクを表示
    const tasksToShow = completedTasks.slice(0, 3);
    tasksToShow.forEach((task, index) => {
      text += `${index + 1}. ✅ ${task.title}\n`;
    });
    
    if (completedTasks.length > 3) {
      text += `... 他${completedTasks.length - 3}件\n`;
    }
    
    text += '\n#TodoApp #生産性向上 #達成感';
    
    return shareToTwitter(text);
  }, [shareToTwitter]);

  // 今週の振り返り投稿
  const shareWeeklyReview = useCallback((
    thisWeekCompleted: number,
    thisWeekTotal: number,
    lastWeekCompleted: number
  ) => {
    const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;
    const improvement = thisWeekCompleted - lastWeekCompleted;
    const improvementText = improvement > 0 
      ? `📈 先週より${improvement}件多く完了`
      : improvement < 0 
        ? `📉 先週より${Math.abs(improvement)}件少なく完了`
        : '📊 先週と同じペース';

    const text = `📅 今週の振り返り
✅ 完了タスク: ${thisWeekCompleted}件
🎯 達成率: ${thisWeekRate}%
${improvementText}

来週も頑張ります！💪

#TodoApp #週次振り返り #生産性向上`;

    return shareToTwitter(text);
  }, [shareToTwitter]);

  return {
    shareTask,
    shareProgress,
    shareCustomMessage,
    shareMultipleTasksCompletion,
    shareWeeklyReview,
    formatTaskForShare,
    formatProgressReport,
    formatCustomMessage,
    getSharePreview,
    shareToTwitter
  };
};