import React, { useState, useEffect } from 'react';
import { Bell, X, Plus, Edit2, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTodo } from '@/contexts/TodoContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Reminder, Notification } from '@/types/todo';

interface RemindersDialogProps {
  taskId: string;
  taskTitle: string;
  dueDate?: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemindersUpdate?: () => void;
}

export function RemindersDialog({
  taskId,
  taskTitle,
  dueDate,
  open,
  onOpenChange,
  onRemindersUpdate,
}: RemindersDialogProps) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [minutesBefore, setMinutesBefore] = useState<number>(60);
  const [type, setType] = useState<'in-app' | 'email' | 'push'>('in-app');
  const [recurring, setRecurring] = useState<'once' | 'daily' | 'weekly'>('once');

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/reminders?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReminders();
    }
  }, [open, taskId]);

  const handleAddReminder = async () => {
    if (!user || !dueDate) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          title: `Reminder: ${taskTitle}`,
          minutesBefore,
          type,
          recurring,
        }),
      });

      if (response.ok) {
        const newReminder = await response.json();
        setReminders([...reminders, newReminder]);
        setMinutesBefore(60);
        onRemindersUpdate?.();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/reminders', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminderId }),
      });

      if (response.ok) {
        setReminders(reminders.filter(r => r.id !== reminderId));
        onRemindersUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleToggleReminder = async (reminderId: string, enabled: boolean) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderId,
          enabled: !enabled,
        }),
      });

      if (response.ok) {
        setReminders(
          reminders.map(r =>
            r.id === reminderId ? { ...r, enabled: !r.enabled } : r
          )
        );
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Reminders for "{taskTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Reminders */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Your Reminders</h3>
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reminders yet. Add one below!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{reminder.minutesBefore} min before</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {reminder.type} • {reminder.recurring}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleReminder(reminder.id, reminder.enabled)}
                      className={`p-1 rounded ${
                        reminder.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {reminder.enabled ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Reminder */}
          {dueDate && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-sm">Add Reminder</h3>

              <div className="space-y-2">
                <label className="text-xs font-medium">Minutes Before Due</label>
                <Select
                  value={minutesBefore.toString()}
                  onValueChange={(val) => setMinutesBefore(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                    <SelectItem value="2880">2 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Notification Type</label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-app">In-App</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Recurrence</label>
                <Select value={recurring} onValueChange={(val: any) => setRecurring(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddReminder}
                disabled={loading}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Add Reminder'}
              </Button>
            </div>
          )}

          {!dueDate && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Please set a due date for this task first
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
