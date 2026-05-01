// /src/utils/timezoneUtils.js

import { DateTime } from "luxon";

export const EASTERN_TIMEZONE = "America/New_York";

export const CALL_CENTER_TIMEZONES = {
  Concentrix: "Asia/Manila",
  Telus: "Asia/Manila",
  Buwelo: "America/Bogota",
  WNS: "Asia/Kolkata",
  TEP: "America/Santo_Domingo",
};

export function getSourceTimezone(callCenter) {
  return CALL_CENTER_TIMEZONES[callCenter] || EASTERN_TIMEZONE;
}

export function parseLocalDateTime(dateValue, timeValue, sourceTimezone) {
  const dateText = String(dateValue || "").trim();
  const timeText = String(timeValue || "").trim();

  if (!dateText || !timeText) {
    return null;
  }

  const possibleFormats = [
    "yyyy-MM-dd h:mm a",
    "yyyy-MM-dd H:mm",
    "MM/dd/yyyy h:mm a",
    "MM/dd/yyyy H:mm",
    "M/d/yyyy h:mm a",
    "M/d/yyyy H:mm",
  ];

  const combined = `${dateText} ${timeText}`;

  for (const format of possibleFormats) {
    const parsed = DateTime.fromFormat(combined, format, {
      zone: sourceTimezone,
    });

    if (parsed.isValid) {
      return parsed;
    }
  }

  const fallback = DateTime.fromJSDate(new Date(combined), {
    zone: sourceTimezone,
  });

  return fallback.isValid ? fallback : null;
}

export function convertShiftToEastern({
  callCenter,
  date,
  startTime,
  endTime,
  unpaidBreakHours = 0,
}) {
  const sourceTimezone = getSourceTimezone(callCenter);

  let startLocal = parseLocalDateTime(date, startTime, sourceTimezone);
  let endLocal = parseLocalDateTime(date, endTime, sourceTimezone);

  if (!startLocal || !endLocal) {
    return null;
  }

  if (endLocal <= startLocal) {
    endLocal = endLocal.plus({ days: 1 });
  }

  const startEastern = startLocal.setZone(EASTERN_TIMEZONE);
  const endEastern = endLocal.setZone(EASTERN_TIMEZONE);

  const grossHours = endLocal.diff(startLocal, "hours").hours;
  const billableHours = Math.max(grossHours - Number(unpaidBreakHours || 0), 0);

  return {
    callCenter,
    sourceTimezone,
    targetTimezone: EASTERN_TIMEZONE,

    shiftStartLocal: startLocal.toFormat("yyyy-MM-dd HH:mm"),
    shiftEndLocal: endLocal.toFormat("yyyy-MM-dd HH:mm"),

    shiftStartEastern: startEastern.toFormat("yyyy-MM-dd HH:mm"),
    shiftEndEastern: endEastern.toFormat("yyyy-MM-dd HH:mm"),

    easternDate: startEastern.toISODate(),

    grossHours,
    unpaidBreakHours: Number(unpaidBreakHours || 0),
    billableHours,
  };
}