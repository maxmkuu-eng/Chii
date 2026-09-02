import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const NotificationsModule: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    clearAllNotifications,
    showToast,
  } = useApp();

  const handleMarkAll = async () => {
    await markNotificationRead();
    showToast({ title: 'Notifications Read', message: 'All marked as read', type: 'info' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" /> Notifications & Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            System status updates, background tasks, and AI workspace alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are completely up to date. System notifications and task milestones will be listed here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            let Icon = Info;
            let iconColor = 'text-blue-500 bg-blue-500/10';

            if (n.type === 'success') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-500 bg-emerald-500/10';
            } else if (n.type === 'warning') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-500 bg-amber-500/10';
            } else if (n.type === 'error') {
              Icon = AlertCircle;
              iconColor = 'text-rose-500 bg-rose-500/10';
            }

            return (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !n.read
                    ? 'bg-amber-50/40 dark:bg-amber-500/5 border-amber-500/30 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {n.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
