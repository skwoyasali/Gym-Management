import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, CalendarCheck, CircleAlert, Clock3 } from "lucide-react";
import { checkIn, getMyAttendance } from "../../services/attendanceService";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export default function MemberCheckIn() {
  const [attendance, setAttendance] = useState([]);
  const [todayKey, setTodayKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAttendance = useCallback(async () => {
    const response = await getMyAttendance();
    setAttendance(response.data.data);
    setTodayKey(response.data.today);
  }, []);

  useEffect(() => {
    let active = true;
    getMyAttendance()
      .then((response) => {
        if (!active) return;
        setAttendance(response.data.data);
        setTodayKey(response.data.today);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your attendance history."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasCheckedInToday = attendance.some(
    (record) =>
      new Date(record.attendanceDate).toISOString().slice(0, 10) === todayKey
  );

  const handleCheckIn = async () => {
    setError("");
    setNotice("");
    setCheckingIn(true);
    try {
      const response = await checkIn();
      setNotice(response.data.message || "Attendance recorded.");
      await loadAttendance();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to record check-in."
      );
      if (requestError.response?.status === 409) {
        loadAttendance().catch((loadError) =>
          console.error("Load attendance error:", loadError)
        );
      }
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Attendance</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Check in
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Record your visit and review your recent gym check-ins.
        </p>
      </header>

      {error && (
        <p
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {notice && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {notice}
        </p>
      )}

      <section className="flex flex-col gap-5 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium text-indigo-300">TODAY’S VISIT</p>
          <h2 className="mt-2 text-xl font-bold">
            {hasCheckedInToday ? "You’re checked in" : "Ready to work out?"}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {loading
              ? "Checking today’s attendance..."
              : hasCheckedInToday
                ? "Your attendance has been recorded for today."
                : "Check in when you arrive at the gym."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasCheckedInToday && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Checked in
            </span>
          )}
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading || checkingIn || hasCheckedInToday}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-300/30 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            {checkingIn
              ? "Checking in..."
              : hasCheckedInToday
                ? "Checked in today"
                : "Check in"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Attendance history</h2>
            <p className="text-sm text-slate-500">Your latest gym check-ins</p>
          </div>
        </div>
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            Loading attendance...
          </p>
        ) : attendance.length ? (
          <ul className="divide-y divide-slate-100">
            {attendance.map((record) => (
              <li
                key={record._id}
                className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
              >
                <span className="font-medium text-slate-800">
                  {formatDate(record.attendanceDate)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(record.checkedInAt))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <CalendarCheck
              className="mx-auto h-8 w-8 text-slate-300"
              aria-hidden="true"
            />
            <p className="mt-3 font-medium text-slate-800">No attendance yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Your check-ins will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
