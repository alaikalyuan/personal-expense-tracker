"use client";

import { useState, useEffect } from "react";
import {
  BellRing,
  Sparkles,
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
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { CheckboxField, TextField } from "@/app/ui/Field";

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
    <Dialog
      isOpen
      onClose={onClose}
      busy={isTogglingPush}
      title={t.notifications.title}
      description={t.notifications.subtitle}
      closeLabel={t.notifications.closeBtn}
      footer={
        <>
          <Button block onClick={onClose}>
            {t.notifications.closeBtn}
          </Button>
          <Button block variant="primary" onClick={handleSavePreferences}>
            {t.notifications.saveBtn}
          </Button>
        </>
      }
    >
      {isGuest && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span>{t.notifications.guestWarning}</span>
        </p>
      )}

      {/* Master push switch */}
      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <BellRing aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{t.notifications.pushCardTitle}</p>
              <p id="push-status" className="mt-0.5 text-xs text-ink-soft">
                {isSubscribed
                  ? t.notifications.pushActive
                  : permission === "denied"
                  ? t.notifications.pushBlocked
                  : t.notifications.pushInactive}
              </p>
            </div>
          </div>
          <Button
            variant={isSubscribed ? "secondary" : "primary"}
            disabled={isTogglingPush || isGuest}
            onClick={handleTogglePush}
            aria-describedby="push-status"
          >
            {isTogglingPush ? t.notifications.btnProcessing : isSubscribed ? t.notifications.btnActive : t.notifications.btnEnable}
          </Button>
        </div>

        {isSubscribed && (
          <div className="mt-3 flex justify-end border-t border-line pt-2">
            <Button variant="ghost" onClick={handleSendTest} className="-mr-2">
              <Send aria-hidden="true" className="h-4 w-4" />
              {t.notifications.sendTestBtn}
            </Button>
          </div>
        )}
      </div>

      {testStatus && (
        <p
          role={testStatus.type === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border p-3 text-xs font-medium ${
            testStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              : testStatus.type === "error"
              ? "border-danger bg-danger-soft text-danger"
              : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
          }`}
        >
          {testStatus.msg}
        </p>
      )}

      {/* Preferences */}
      <div className="mt-5 flex flex-col gap-3">
        <TextField
          label={t.notifications.dailyReminderTime}
          hint={t.notifications.dailyReminderTimeDesc}
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="scheme-light dark:scheme-dark"
        />
        <CheckboxField
          checked={dailyReminder}
          onChange={(e) => setDailyReminder(e.target.checked)}
          label={<span className="font-semibold">{t.notifications.reminderToggleTitle}</span>}
          hint={t.notifications.reminderToggleDesc}
        />
        <CheckboxField
          checked={motivationalQuotes}
          onChange={(e) => setMotivationalQuotes(e.target.checked)}
          label={
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-amber-600" />
              {t.notifications.quotesToggleTitle}
            </span>
          }
          hint={t.notifications.quotesToggleDesc}
        />
        <CheckboxField
          checked={subscriptionReminders}
          onChange={(e) => setSubscriptionReminders(e.target.checked)}
          label={<span className="font-semibold">{t.notifications.subsToggleTitle}</span>}
          hint={t.notifications.subsToggleDesc}
        />
      </div>

      <div className="mt-5 rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink-soft">
        <p className="mb-0.5 font-semibold text-ink">{t.notifications.tipsTitle}</p>
        {t.notifications.tipsDesc}
      </div>
    </Dialog>
  );
}
