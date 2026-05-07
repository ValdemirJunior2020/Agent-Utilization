// /src/services/googleSheetApi.js

const API_URL = import.meta.env.VITE_UTILIZATION_API_URL;

function normalizeId(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeVendor(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === "teleperformance") return "TEP";
  if (text === "tep") return "TEP";
  if (text === "concentrix") return "Concentrix";
  if (text === "buwelo") return "Buwelo";
  if (text === "wns") return "WNS";
  if (text === "telus") return "Telus";

  return value || "Unknown";
}

async function request(action, params = {}) {
  if (!API_URL) {
    throw new Error("Missing VITE_UTILIZATION_API_URL in .env file.");
  }

  const url = new URL(API_URL);

  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Sheet API failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Google Sheet API returned success=false.");
  }

  return data;
}

export async function loadGoogleSheetCore() {
  return request("getAllCore", {
    activeOnly: true,
  });
}

export function buildGoogleSheetAgentMapIndex(agentMap = {}) {
  const index = {};

  Object.entries(agentMap).forEach(([vendor, vendorMap]) => {
    const normalizedVendor = normalizeVendor(vendor);

    if (!index[normalizedVendor]) {
      index[normalizedVendor] = {};
    }

    Object.entries(vendorMap || {}).forEach(([agentId, record]) => {
      const normalizedId = normalizeId(agentId);

      if (!normalizedId) return;

      index[normalizedVendor][normalizedId] = {
        ...record,
        vendor: normalizedVendor,
      };
    });
  });

  return index;
}