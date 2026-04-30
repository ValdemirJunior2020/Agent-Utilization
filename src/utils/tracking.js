// /src/utils/tracking.js

import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import { analyticsPromise, db } from "../firebase/firebase";

function getSessionId() {
  const key = "hp_operations_session_id";
  const existing = localStorage.getItem(key);

  if (existing) return existing;

  const created = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, created);
  return created;
}

export async function trackEvent(eventName, eventData = {}) {
  const cleanEventName = String(eventName || "unknown_event")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

  const payload = {
    eventName: cleanEventName,
    sessionId: getSessionId(),
    page: window.location.pathname,
    createdAt: serverTimestamp(),
    ...eventData,
  };

  try {
    const analytics = await analyticsPromise;

    if (analytics) {
      logEvent(analytics, cleanEventName, eventData);
    }
  } catch (error) {
    console.warn("Firebase Analytics event failed:", error);
  }

  try {
    await addDoc(collection(db, "pageEvents"), payload);
  } catch (error) {
    console.warn("Firestore event save failed:", error);
  }
}

export async function trackPageVisit() {
  return trackEvent("page_visit", {
    title: document.title || "HotelPlanner Operations View",
  });
}

export async function getUsageStats() {
  const snapshot = await getDocs(
    query(collection(db, "pageEvents"), orderBy("createdAt", "desc"), limit(5000))
  );

  const events = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const visits = events.filter((event) => event.eventName === "page_visit").length;
  const clicks = events.filter((event) => event.eventName?.includes("click")).length;
  const uploads = events.filter((event) => event.eventName === "reports_uploaded").length;
  const exports = events.filter((event) => event.eventName === "export_summary_click").length;

  return {
    visits,
    clicks,
    uploads,
    exports,
    totalEvents: events.length,
    recentEvents: events.slice(0, 10),
  };
}