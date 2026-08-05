"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "unsupported" | "checking" | "denied" | "subscribed" | "unsubscribed";

function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function PushNotificationManager() {
  const [status, setStatus] = useState<Status>(() =>
    isPushSupported() ? "checking" : "unsupported"
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "subscribed" : "unsubscribed");
    })();
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported") {
    return (
      <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        この端末・ブラウザはプッシュ通知に対応していません。
      </p>
    );
  }

  if (status === "checking") return null;

  if (status === "denied") {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        通知がブロックされています。ブラウザの設定から通知を許可してください。
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={status === "subscribed" ? unsubscribe : subscribe}
      disabled={busy}
      className={`w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
        status === "subscribed"
          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          : "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
      }`}
    >
      {busy
        ? "処理中…"
        : status === "subscribed"
          ? "🔔 通知は有効です（タップで無効化）"
          : "🔔 プッシュ通知を有効にする"}
    </button>
  );
}
