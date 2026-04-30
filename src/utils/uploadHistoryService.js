// /src/utils/uploadHistoryService.js

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function saveUploadHistory(reports = []) {
  const saved = [];

  for (const report of reports) {
    const payload = {
      fileName: report.fileName || "Unknown File",
      sheetName: report.sheetName || "Unknown Sheet",
      callCenter: report.callCenter || "Unknown",
      reportStartDate: report.reportStartDate || "Date not detected",
      reportEndDate: report.reportEndDate || "Date not detected",
      reportDateRange: report.reportDateRange || "Date not detected",
      reportDateCount: report.reportDateCount || 0,
      rowCount: report.rowCount || 0,
      uploadedAt: report.uploadedAt || new Date().toLocaleString(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "uploadHistory"), payload);
    saved.push({
      id: docRef.id,
      ...payload,
    });
  }

  return saved;
}

export async function getUploadHistory() {
  const snapshot = await getDocs(
    query(collection(db, "uploadHistory"), orderBy("createdAt", "desc"), limit(100))
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}