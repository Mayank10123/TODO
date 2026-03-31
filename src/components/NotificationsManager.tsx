import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  X,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  Mail,
  Smartphone,
  Power,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationConfig {
  id?: string;
  title: string;
  message: string;
  type: string;
  duration: number;
  frequency: 'once' | 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  deliveryTime: string; // "HH:MM"
  deliveryMethod: 'in-app' | 'email' | 'push' | 'all';
  enabled: boolean;
  nextTrigger?: Date;
}

export function NotificationsManager() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<NotificationConfig>({
    title: '',
    message: '',
    type: 'custom',
    duration: 5000,
    frequency: 'once',
    deliveryTime: '09:00',
    deliveryMethod: 'in-app',
    enabled: true,
  });

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleSave = async () => {
    if (!user || !formData.title || !formData.message) {
      alert('Please fill in title and message');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { notificationId: editingId, ...formData }
        : formData;

      const response = await fetch('/api/notifications', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingId) {
          setNotifications(
            notifications.map(n => (n.id === editingId ? data : n))
          );
        } else {
          setNotifications([data, ...notifications]);
        }
        resetForm();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this notification?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: id }),
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: id,
          enabled: !enabled,
        }),
      });

      if (response.ok) {
        setNotifications(
          notifications.map(n =>
            n.id === id ? { ...n, enabled: !n.enabled } : n
          )
        );
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'custom',
      duration: 5000,
      frequency: 'once',
      deliveryTime: '09:00',
      deliveryMethod: 'in-app',
      enabled: true,
    });
    setEditingId(null);
  };

  const handleEdit = (notif: NotificationConfig) => {
    setFormData(notif);
    setEditingId(notif.id || null);
    setOpen(true);
  };

  const deliveryMethodColors = {
    'in-app': 'bg-blue-100 text-blue-700',
    'email': 'bg-green-100 text-green-700',
    'push': 'bg-purple-100 text-purple-700',
    'all': 'bg-orange-100 text-orange-700',
  };

  const frequencyLabels = {
    once: '🔔 Once',
    daily: '📅 Daily',
    weekly: '📆 Weekly',
    custom: '⚙️ Custom',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifications
        </h2>
        <Button onClick={() => { resetForm(); setOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          New Notification
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-8 text-center bg-muted rounded-lg">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground/70">
              Create one to get started
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                notif.enabled
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{notif.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notif.message}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Delivery Method */}
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        deliveryMethodColors[
                          notif.deliveryMethod as keyof typeof deliveryMethodColors
                        ]
                      }`}
                    >
                      {notif.deliveryMethod === 'in-app' && <Bell className="w-3 h-3" />}
                      {notif.deliveryMethod === 'email' && <Mail className="w-3 h-3" />}
                      {notif.deliveryMethod === 'push' && <Smartphone className="w-3 h-3" />}
                      {notif.deliveryMethod === 'all' && <Check className="w-3 h-3" />}
                      {notif.deliveryMethod}
                    </span>

                    {/* Frequency */}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300">
                      {frequencyLabels[notif.frequency as keyof typeof frequencyLabels]}
                    </span>

                    {/* Time */}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-300">
                      <Clock className="w-3 h-3" />
                      {notif.deliveryTime}
                    </span>

                    {/* Duration */}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-300">
                      <AlertCircle className="w-3 h-3" />
                      {notif.duration / 1000}s
                    </span>
                  </div>

                  {notif.nextTrigger && (
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 Next: {new Date(notif.nextTrigger).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(notif.id!, notif.enabled)}
                    className={notif.enabled ? 'text-green-600' : 'text-gray-400'}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(notif)}
                    className="text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notif.id!)}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '✏️ Edit Notification' : '🔔 Create New Notification'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Title */}
            <div>
              <label className="text-sm font-semibold block mb-2">Title</label>
              <Input
                placeholder="e.g., Daily Standup"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold block mb-2">Message</label>
              <textarea
                placeholder="What should the notification say?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-semibold block mb-2">Type</label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="task-reminder">Task Reminder</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-sm font-semibold block mb-2">Frequency</label>
              <Select
                value={formData.frequency}
                onValueChange={(val: any) => setFormData({ ...formData, frequency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Every Day</SelectItem>
                  <SelectItem value="weekly">Every Week</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>

              {formData.frequency === 'custom' && (
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <Button
                      key={day}
                      variant={
                        formData.customDays?.includes(idx) ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => {
                        const days = formData.customDays || [];
                        if (days.includes(idx)) {
                          setFormData({
                            ...formData,
                            customDays: days.filter(d => d !== idx),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            customDays: [...days, idx],
                          });
                        }
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Time */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                Delivery Time
              </label>
              <Input
                type="time"
                value={formData.deliveryTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryTime: e.target.value })
                }
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                Duration (seconds)
              </label>
              <Select
                value={(formData.duration / 1000).toString()}
                onValueChange={(val) =>
                  setFormData({ ...formData, duration: Number(val) * 1000 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Method */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                How to receive
              </label>
              <Select
                value={formData.deliveryMethod}
                onValueChange={(val: any) =>
                  setFormData({ ...formData, deliveryMethod: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-app">In-App Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="push">Browser Push Only</SelectItem>
                  <SelectItem value="all">All Methods</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => { setOpen(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
