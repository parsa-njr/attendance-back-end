const { format } = require("date-fns");
const moment = require("moment-jalaali");
const { toGregorian, jalaaliMonthLength } = require("jalaali-js");

// Formats a Date object to a readable string like "04:30 PM"
const formatTime = (date) => (!date ? "--:--" : format(date, "hh:mm a"));

// Converts a number of minutes into a "Xh Ym" format (e.g., 150 -> "2h 30m")
const formatMinutesToXhYm = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
};

// Converts a time string (e.g. "08:30") into total minutes (e.g. 510)
const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === "--:--") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

// Converts total minutes (e.g. 510) into a time string (e.g. "08:30")
const minutesToTime = (tminute) => {
  const hours = Math.floor(tminute / 60);
  const minutes = tminute % 60;
  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  return `${paddedHours}:${paddedMinutes}`;
};

// Converts a given Jalali year and month to the equivalent Gregorian start and end dates
const getPersianDateRange = (jYear, jMonth) => {
  if (!Number.isInteger(jYear) || !Number.isInteger(jMonth)) {
    throw new Error("Invalid Jalali year or month");
  }

  const startGreg = toGregorian(jYear, jMonth, 1);
  const daysInMonth = jalaaliMonthLength(jYear, jMonth);
  const endGreg = toGregorian(jYear, jMonth, daysInMonth);

  const startDate = new Date(
    Date.UTC(startGreg.gy, startGreg.gm - 1, startGreg.gd, 0, 0, 0)
  );
  const endDate = new Date(
    Date.UTC(endGreg.gy, endGreg.gm - 1, endGreg.gd, 0, 0, 0)
  );

  return { startDate, endDate, daysInMonth };
};

/**
 * Generates a working calendar based on shift configuration.
 * It iterates day-by-day between the start and end dates and builds a schedule
 * with consideration for exceptions and weekly shift rules.
 */
function generateWorkCalendar(shiftConfig) {
  const calendar = [];
  const exceptionMap = {};

  // Map exception days for quick access
  if (shiftConfig.exceptionDays && shiftConfig.exceptionDays.length) {
    for (const ex of shiftConfig.exceptionDays) {
      const dateStr = moment(ex.date).format("YYYY-MM-DD");
      exceptionMap[dateStr] = ex.time;
    }
  }

  let currentDate = moment(shiftConfig.startDate);
  const endDate = moment(shiftConfig.endDate);

  // Iterate each day and determine shift time or off-day
  while (currentDate.isSameOrBefore(endDate)) {
    const dateStr = currentDate.format("YYYY-MM-DD");
    const weekdayIndex = (currentDate.isoWeekday() - 1) % 7; // 0-6
    const isExceptionDay = !!exceptionMap[dateStr];
    const exceptionTime = exceptionMap[dateStr];

    let time = [];
    let isOffDay = false;

    if (isExceptionDay) {
      time = exceptionTime;
    } else {
      const shiftDay = shiftConfig.shiftDays[weekdayIndex];
      if (shiftDay) {
        time = shiftDay.time;
        isOffDay = shiftDay.isOffDay;
      }
    }

    calendar.push({
      date: dateStr,
      isOffDay,
      isExceptionDay,
      time,
    });

    currentDate.add(1, "day");
  }

  return calendar;
}

/**
 * Calculates detailed attendance report with metrics:
 * - Delay, Deficit, Overtime, Leave, and actual working hours
 * - Takes into account exceptions, off-days, and requests
 */
function calculateDetailedAttendanceReport(
  calendar,
  attendanceRecords,
  requests,
  shiftDefinition
) {
  const report = [];
  const requestsMap = mapRequestsByDateTime(requests);

  // ✅ Step 1: Determine the min and max attendance dates
  const attendanceDates = attendanceRecords.map((r) =>
    moment(r.date).format("YYYY-MM-DD")
  );

  const minDate = moment
    .min(attendanceDates.map((d) => moment(d)))
    .format("YYYY-MM-DD");
  const maxDate = moment
    .max(attendanceDates.map((d) => moment(d)))
    .format("YYYY-MM-DD");

  // ✅ Step 2: Filter calendar days within the attendance range
  const filteredCalendar = calendar.filter((day) => {
    return day.date >= minDate && day.date <= maxDate;
  });

  // Use filtered calendar from now on
  const exceptionMap = {};
  if (shiftDefinition?.exceptionDays?.length) {
    for (const ex of shiftDefinition.exceptionDays) {
      const dateStr = moment(ex.date).format("YYYY-MM-DD");
      exceptionMap[dateStr] = ex.time;
    }
  }

  const shiftDaysMap = {};
  if (shiftDefinition?.shiftDays?.length) {
    for (const day of shiftDefinition.shiftDays) {
      shiftDaysMap[day.day] = day;
    }
  }

  // Process each calendar day
  for (const day of filteredCalendar) {
    const dateStr = day.date;
    const weekday = moment(dateStr).isoWeekday();
    const exceptionTime = exceptionMap[dateStr];
    const shiftDay = shiftDaysMap[weekday];

    let plannedStart, plannedEnd;
    let isOffDay = false;

    if (exceptionTime) {
      plannedStart = moment(`${dateStr}T${exceptionTime[0].startTime}`);
      plannedEnd = moment(`${dateStr}T${exceptionTime[0].endTime}`);
    } else if (shiftDay && shiftDay.time?.length) {
      isOffDay = shiftDay.isOffDay;
      plannedStart = moment(`${dateStr}T${shiftDay.time[0].startTime}`);
      plannedEnd = moment(`${dateStr}T${shiftDay.time[0].endTime}`);
    } else {
      report.push({ date: dateStr, status: "بدون برنامه شیفت" });
      continue;
    }

    const plannedDuration = plannedEnd.diff(plannedStart, "minutes");

    const attendance = attendanceRecords.find(
      (rec) => moment(rec.date).format("YYYY-MM-DD") === dateStr
    );

    const dayRequests = requestsMap[dateStr] || [];
    const leaveRanges = dayRequests.filter((r) => r.type === "leave");
    const extraRanges = dayRequests.filter((r) => r.type === "extraTime");
    const leaveMinutes = sumOverlapMinutes(
      plannedStart,
      plannedEnd,
      leaveRanges,
      dateStr
    );
    if (attendance && attendance.sessions.length > 0) {
      const session = attendance.sessions[0];

      if (session.checkIn && session.checkOut) {
        const checkIn = moment(session.checkIn);
        const checkOut = moment(session.checkOut);
        const actualDuration = checkOut.diff(checkIn, "minutes");

        const delay = Math.max(0, checkIn.diff(plannedStart, "minutes"));

        const extraMinutes = sumOverlapMinutes(
          checkOut,
          moment(`${dateStr}T23:59`),
          extraRanges,
          dateStr
        );

        const deficit = isOffDay
          ? 0
          : Math.max(0, plannedDuration - actualDuration - leaveMinutes);
        const overtime = isOffDay
          ? actualDuration
          : Math.max(0, actualDuration - plannedDuration - extraMinutes);
        if (plannedDuration !== leaveMinutes) {
          report.push({
            date: dateStr,
            expectedStart: plannedStart.format("HH:mm"),
            expectedEnd: plannedEnd.format("HH:mm"),
            actualCheckIn: checkIn.format("HH:mm"),
            actualCheckOut: checkOut.format("HH:mm"),
            plannedMinutes: minutesToTime(plannedDuration),
            actualMinutes: minutesToTime(actualDuration),
            leaveMinutes: minutesToTime(leaveMinutes),
            extraTimeRequestMinutes: minutesToTime(extraMinutes),
            delayMinutes: minutesToTime(delay),
            deficitMinutes: minutesToTime(deficit),
            overtimeMinutes: minutesToTime(overtime),
            isOffDay,
            status:
              delay > 0 ? "delay" : deficit > 0 ? "deficit" : "fullPresent",
          });
        } else {
          report.push({
            date: dateStr,
            expectedStart: plannedStart.format("HH:mm"),
            expectedEnd: plannedEnd.format("HH:mm"),
            status: "leave",
          });
        }
      } else {
        report.push({
          date: dateStr,
          expectedStart: plannedStart.format("HH:mm"),
          expectedEnd: plannedEnd.format("HH:mm"),
          status: "ورود یا خروج ناقص",
        });
      }
    } else {
      const isFullDayLeave =
        leaveRanges.some((r) => r.from === "00:00" && r.to === "23:59") ||
        plannedDuration === leaveMinutes;
      if (isFullDayLeave) {
        report.push({
          date: dateStr,
          expectedStart: plannedStart.format("HH:mm"),
          expectedEnd: plannedEnd.format("HH:mm"),
          status: "leave",
        });
      } else if (!isOffDay) {
        report.push({
          date: dateStr,
          expectedStart: plannedStart.format("HH:mm"),
          expectedEnd: plannedEnd.format("HH:mm"),
          status: "absent",
        });
      } else {
        report.push({
          date: dateStr,
          status: "shiftOffDay",
        });
      }
    }
  }

  return report;
}

/**
 * Groups accepted requests (leave, extra time) by day with time ranges.
 */
function mapRequestsByDateTime(requests) {
  const map = {};

  for (const req of requests) {
    if (req.status !== "accepted") continue;

    const start = moment(req.startDate);
    const end = moment(req.endDate);
    const isSameDay = start.isSame(end, "day");

    if (isSameDay) {
      const dateStr = start.format("YYYY-MM-DD");
      if (!map[dateStr]) map[dateStr] = [];

      map[dateStr].push({
        type: req.requestType,
        from: start.format("HH:mm"),
        to: end.format("HH:mm"),
      });
    } else {
      for (
        let d = moment(start).startOf("day");
        d.isSameOrBefore(end);
        d.add(1, "day")
      ) {
        const dateStr = d.format("YYYY-MM-DD");
        if (!map[dateStr]) map[dateStr] = [];

        const from = d.isSame(start, "day") ? start.format("HH:mm") : "00:00";
        const to = d.isSame(end, "day") ? end.format("HH:mm") : "23:59";

        map[dateStr].push({
          type: req.requestType,
          from,
          to,
        });
      }
    }
  }

  return map;
}

/**
 * Sums the total minutes of overlapping time ranges within a specified interval.
 */
function sumOverlapMinutes(rangeStart, rangeEnd, ranges, date) {
  let total = 0;

  for (const r of ranges) {
    const from = moment(`${date}T${r.from}`);
    const to = moment(`${date}T${r.to}`);

    const overlapStart = moment.max(rangeStart, from);
    const overlapEnd = moment.min(rangeEnd, to);

    if (overlapEnd.isAfter(overlapStart)) {
      total += overlapEnd.diff(overlapStart, "minutes");
    }
  }

  return total;
}

function summarizeAttendance(data) {


  // Initialize summary object
  const summary = {
    totalDays: data.length,
    workingDays: 0,
    offDays: 0,
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    totalPlannedMinutes: 0,
    totalActualMinutes: 0,
    totalLeaveMinutes: 0,
    totalOvertimeMinutes: 0,
    totalDelayMinutes: 0,
    totalDeficitMinutes: 0,
    statusCount: {
      fullPresent: 0,
      delay: 0,
      deficit: 0,
      absent: 0,
      leave: 0,
      shiftOffDay: 0,
    },
    averageDailyOvertime: 0,
    averageDailyDelay: 0,
    averageDailyDeficit: 0,
    overallBalanceMinutes: 0,
  };

  // Process each day's data
  data.forEach((day) => {
    if (day.isOffDay || day.status === "shiftOffDay") {
      summary.offDays++;
      summary.statusCount.shiftOffDay++;
      return;
    }

    summary.workingDays++;

    if (day.status === "absent") {
      summary.absentDays++;
      summary.statusCount.absent++;
      return;
    }

    if (day.status === "leave") {
      summary.leaveDays++;
      summary.statusCount.leave++;
      summary.totalLeaveMinutes += timeToMinutes(day.plannedMinutes || "08:00");
      return;
    }

    // Present days (fullPresent, delay, deficit)
    summary.presentDays++;
    summary.statusCount[day.status]++;

    const planned = timeToMinutes(day.plannedMinutes);
    const actual = timeToMinutes(day.actualMinutes);
    const overtime = timeToMinutes(day.overtimeMinutes);
    const delay = timeToMinutes(day.delayMinutes);
    const deficit = timeToMinutes(day.deficitMinutes);

    summary.totalPlannedMinutes += planned;
    summary.totalActualMinutes += actual;
    summary.totalOvertimeMinutes += overtime;
    summary.totalDelayMinutes += delay;
    summary.totalDeficitMinutes += deficit;
  });

  // Calculate averages and overall balance
  summary.averageDailyOvertime =
    summary.presentDays > 0
      ? Math.round(summary.totalOvertimeMinutes / summary.presentDays)
      : 0;

  summary.averageDailyDelay =
    summary.presentDays > 0
      ? Math.round(summary.totalDelayMinutes / summary.presentDays)
      : 0;

  summary.averageDailyDeficit =
    summary.presentDays > 0
      ? Math.round(summary.totalDeficitMinutes / summary.presentDays)
      : 0;

  summary.overallBalanceMinutes =
    summary.totalOvertimeMinutes -
    summary.totalDeficitMinutes -
    summary.absentDays * 8 * 60 -
    summary.leaveDays * 8 * 60;

 

  // Convert minute totals to time strings
  return {
    // ...summary,
    totalPlannedTime: minutesToTime(summary.totalPlannedMinutes),
    totalActualTime: minutesToTime(summary.totalActualMinutes),
    totalLeaveTime: minutesToTime(summary.totalLeaveMinutes),
    totalOvertime: minutesToTime(summary.totalOvertimeMinutes),
    totalDelay: minutesToTime(summary.totalDelayMinutes),
    totalDeficit: minutesToTime(summary.totalDeficitMinutes),
    averageDailyOvertime: minutesToTime(summary.averageDailyOvertime),
    averageDailyDelay: minutesToTime(summary.averageDailyDelay),
    averageDailyDeficit: minutesToTime(summary.averageDailyDeficit),
    // overallBalance: minutesToTime(summary.overallBalanceMinutes),
    // Include status counts for reference
    statusCount: summary.statusCount,
  };
}

// Example usage:
// const summary = summarizeAttendance(attendanceData);
// console.log(summary);

module.exports = {
  formatTime,
  formatMinutesToXhYm,
  timeToMinutes,
  getPersianDateRange,
  generateWorkCalendar,
  calculateDetailedAttendanceReport,
  summarizeAttendance,
  mapRequestsByDateTime,
  sumOverlapMinutes,
};
