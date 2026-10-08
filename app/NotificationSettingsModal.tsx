"use client";

import { useState, useEffect } from "react";
import {
  BellRing,
  Clock,
  Sparkles,
  X,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  isPushNotificationSupported,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  getCurrentPushSubscription,
} from "@/utils/pwa/pushManager";
import { updateNotificationSettings } from "@/app/subscriptions/actions";
import { useTranslation } from "@/utils/i18n/context";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGuest?: boolean;
  initialSettings?: {
    daily_reminder_enabled?: boolean;
    daily_reminder_time?: string;
    motivational_quotes_enabled?: boolean;
    subscription_reminders_enabled?: boolean;
  };
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  isGuest = false,
  initialSettings,
}: NotificationSettingsModalProps) {
  const { t } = useTranslation();
  const [isSupported] = useState(() => isPushNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  // User preference states
  const [dailyReminder, setDailyReminder] = useState(
    initialSettings?.daily_reminder_enabled ?? true
  );
  const [reminderTime, setReminderTime] = useState(
    initialSettings?.daily_reminder_time ?? "20:00"
  );
  const [motivationalQuotes, setMotivationalQuotes] = useState(
    initialSettings?.motivational_quotes_enabled ?? true
  );
  const [subscriptionReminders, setSubscriptionReminders] = useState(
    initialSettings?.subscription_reminders_enabled ?? true
  );

  const [testStatus, setTestStatus] = useState<{
    type: "success" | "error" | "loading";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      getCurrentPushSubscription().then((sub) => {
        setIsSubscribed(Boolean(sub));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    if (!isSupported) {
      alert(t.notifications.unsupportedAlert);
      return;
    }

    if (isGuest) {
      alert(t.notifications.guestAlert);
      return;
    }

    setIsTogglingPush(true);
    setTestStatus(null);

    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
      } else {
        await subscribeToPush();
        setIsSubscribed(true);
        setPermission("granted");
        setTestStatus({
          type: "success",
          msg: t.notifications.enableSuccess,
        });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setTestStatus({
        type: "error",
        msg: e.message || t.notifications.enableError,
      });
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleSavePreferences = async () => {
    if (isGuest) {
      onClose();
      return;
    }

    try {
      await updateNotificationSettings({
        daily_reminder_enabled: dailyReminder,
        daily_reminder_time: reminderTime,
        motivational_quotes_enabled: motivationalQuotes,
        subscription_reminders_enabled: subscriptionReminders,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      alert(t.notifications.saveFailedAlert.replace("{error}", e.message));
    }
  };

  const handleSendTest = async () => {
    setTestStatus({ type: "loading", msg: t.notifications.testSending });
    try {
      await sendTestNotification();
      setTestStatus({
        type: "success",
        msg: t.notifications.testSuccess,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setTestStatus({
        type: "error",
        msg: e.message || t.notifications.testError,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-modal-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t.notifications.title}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t.notifications.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.notifications.closeBtn}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest Warning */}
        {isGuest && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>
              {t.notifications.guestWarning}
            </span>
          </div>
        )}

        {/* Master Push Toggle Card */}
        <div className="mt-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {t.notifications.pushCardTitle}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isSubscribed
                  ? t.notifications.pushActive
                  : permission === "denied"
                  ? t.notifications.pushBlocked
                  : t.notifications.pushInactive}
              </p>
            </div>
            <button
              type="button"
              disabled={isTogglingPush || isGuest}
              onClick={handleTogglePush}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                isSubscribed
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200"
              }`}
            >
              {isTogglingPush ? t.notifications.btnProcessing : isSubscribed ? t.notifications.btnActive : t.notifications.btnEnable}
            </button>
          </div>

          {/* Test Notification Button */}
          {isSubscribed && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
              <button
                type="button"
                onClick={handleSendTest}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{t.notifications.sendTestBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Test Result Status */}
        {testStatus && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-medium ${
              testStatus.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                : testStatus.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
                : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            {testStatus.msg}
          </div>
        )}

        {/* Detailed Preferences */}
        <div className="mt-5 space-y-4">
          {/* Daily Reminder Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.notifications.dailyReminderTime}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {t.notifications.dailyReminderTimeDesc}
                </p>
              </div>
            </div>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-semibold"
            />
          </div>

          {/* Daily Reminder Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {t.notifications.reminderToggleTitle}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {t.notifications.reminderToggleDesc}
              </p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => setDailyReminder(e.target.checked)}
              className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
          </div>

          {/* Motivational Quotes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.notifications.quotesToggleTitle}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {t.notifications.quotesToggleDesc}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={motivationalQuotes}
              onChange={(e) => setMotivationalQuotes(e.target.checked)}
              className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
          </div>

          {/* Subscription Renewals */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {t.notifications.subsToggleTitle}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {t.notifications.subsToggleDesc}
              </p>
            </div>
            <input
              type="checkbox"
              checked={subscriptionReminders}
              onChange={(e) => setSubscriptionReminders(e.target.checked)}
              className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
          </div>
        </div>

        {/* PWA Tips */}
        <div className="mt-5 p-3 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/60 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-0.5">
            {t.notifications.tipsTitle}
          </p>
          {t.notifications.tipsDesc}
        </div>

        {/* Footer Buttons */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {t.notifications.closeBtn}
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            className="flex-1 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
          >
            {t.notifications.saveBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
