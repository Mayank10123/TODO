/**
 * 🧠 Smart Suggestions Engine
 * 
 * Analyzes user behavior and provides intelligent recommendations
 * for task management, prioritization, and productivity
 */

import type { Task, CompletedTask, PomodoroSession, UserData } from '@/types/todo';

export interface Suggestion {
  id: string;
  type: 'breakdown' | 'prioritization' | 'timing' | 'deadline' | 'category' | 'batching';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  taskId?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  createdAt: Date;
}

export class SuggestionsEngine {
  /**
   * Analyze a single task and generate suggestions
   */
  static analyzeSingleTask(task: Task, allTasks: Task[], completedTasks: CompletedTask[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // 1. Task breakdown suggestion - if title is too long or vague
    if (task.title.length > 50) {
      suggestions.push({
        id: `breakdown-${task.id}`,
        type: 'breakdown',
        title: '📋 Task Seems Complex',
        message: `"${task.title.substring(0, 40)}..." might be easier if broken into smaller subtasks.`,
        priority: 'medium',
        taskId: task.id,        createdAt: new Date(),      });
    }

    // 2. Priority analysis - too many high priority tasks
    const highPriorityCount = allTasks.filter(t => t.priority === 'high' && !t.completed).length;
    if (highPriorityCount > 5) {
      suggestions.push({
        id: `priority-${task.id}`,
        type: 'prioritization',
        title: '⚠️ Too Many High Priority Tasks',
        message: `You have ${highPriorityCount} high-priority tasks. Consider re-prioritizing to focus on what truly matters.`,
        priority: 'high',        createdAt: new Date(),      });
    }

    // 3. Past due warning
    if (task.dueDate && task.dueDate < new Date() && !task.completed) {
      suggestions.push({
        id: `overdue-${task.id}`,
        type: 'deadline',
        title: '🚨 Task is Overdue',
        message: `"${task.title}" was due ${Math.floor((Date.now() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days ago.`,
        priority: 'high',
        taskId: task.id,        createdAt: new Date(),      });
    }

    return suggestions;
  }

  /**
   * Analyze user productivity patterns
   */
  static analyzePatternsAndProvideTips(
    pomodoroSessions: PomodoroSession[],
    completedTasks: CompletedTask[],
    allTasks: Task[]
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Group sessions by hour of day
    const hourCounts = new Map<number, number>();
    pomodoroSessions.forEach(session => {
      if (session.completed) {
        const hour = new Date(session.started).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });

    // Find most productive hour
    let maxHour = 6;
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });

    if (maxCount > 0) {
      suggestions.push({
        id: 'timing-pattern',
        type: 'timing',
        title: '⏰ You\'re Most Productive in the Morning',
        message: `You complete the most tasks around ${maxHour}:00 AM. Schedule important work then!`,
        priority: 'medium',        createdAt: new Date(),      });
    }

    // Task batching suggestion
    const categories = new Map<string | undefined, Task[]>();
    allTasks.forEach(task => {
      const cat = task.categoryId;
      categories.set(cat, (categories.get(cat) || []).concat(task));
    });

    for (const [cat, tasks] of categories) {
      if (tasks.filter(t => !t.completed).length > 3) {
        suggestions.push({
          id: `batching-${cat}`,
          type: 'batching',
          title: '🔗 Batch Similar Tasks',
          message: `You have ${tasks.length} tasks in this category. Group them together to minimize context switching.`,
          priority: 'low',          createdAt: new Date(),        });
      }
    }

    // Completion rate insight
    const completionRate = completedTasks.length / (completedTasks.length + allTasks.length) || 0;
    if (completionRate < 0.3) {
      suggestions.push({
        id: 'completion-rate',
        type: 'prioritization',
        title: '📊 You\'re Taking on Too Much',
        message: `Your completion rate is ${Math.round(completionRate * 100)}%. Try to keep it above 50% by adding fewer tasks.`,
        priority: 'high',        createdAt: new Date(),      });
    }

    return suggestions;
  }

  /**
   * Generate category suggestion for new task
   */
  static suggestCategory(taskTitle: string, existingCategories: string[]): string | null {
    const keywords: { [key: string]: string[] } = {
      work: ['meeting', 'project', 'deadline', 'report', 'email', 'presentation', 'quarterly', 'sprint'],
      health: ['exercise', 'gym', 'workout', 'sleep', 'doctor', 'health', 'medicine', 'diet'],
      learning: ['course', 'tutorial', 'learn', 'study', 'read', 'research', 'book', 'training'],
      personal: ['shopping', 'cleaning', 'laundry', 'home', 'family', 'birthday', 'anniversary'],
    };

    const lowerTitle = taskTitle.toLowerCase();

    for (const [category, keywords_list] of Object.entries(keywords)) {
      for (const keyword of keywords_list) {
        if (lowerTitle.includes(keyword)) {
          return category;
        }
      }
    }

    return null;
  }

  /**
   * Get all suggestions for the user
   */
  static getAllSuggestions(userData: UserData): Suggestion[] {
    let allSuggestions: Suggestion[] = [];

    // Analyze each task
    userData.tasks.forEach(task => {
      allSuggestions = allSuggestions.concat(
        this.analyzeSingleTask(task, userData.tasks, userData.completedTasks)
      );
    });

    // Add pattern-based suggestions
    allSuggestions = allSuggestions.concat(
      this.analyzePatternsAndProvideTips(
        userData.pomodoroSessions,
        userData.completedTasks,
        userData.tasks
      )
    );

    return allSuggestions;
  }
}

export default SuggestionsEngine;
