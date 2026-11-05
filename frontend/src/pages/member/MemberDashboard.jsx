import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Check, Clock3, Dumbbell, LogOut, ShieldCheck } from "lucide-react";
import {
  checkIn,
  getMyAttendance,
} from "../../services/attendanceService";
import { logout as clearStoredAuth } from "../../services/authService";
import { logout } from "../../store/authSlice";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export default function MemberDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
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
        if (active) {
          setAttendance(response.data.data);
          setTodayKey(response.data.today);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
            "Unable to load attendance history"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCheckIn = async () => {
    setError("");
    setNotice("");
    setCheckingIn(true);
    try {
      const response = await checkIn();
      setNotice(response.data.message || "Attendance recorded");
      await loadAttendance();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to record check-in"
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

  const handleLogout = () => {
    clearStoredAuth();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const hasCheckedInToday = attendance.some(
    (record) =>
      new Date(record.attendanceDate).toISOString().slice(0, 10) === todayKey
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                {user?.tenantName || "GymPro"}
              </p>
              <p className="text-xs text-slate-500">Member portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-300">
                MEMBER PORTAL
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Welcome, {user?.username || "Member"}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Check in when you arrive at the gym.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={checkingIn || hasCheckedInToday}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-300/30 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {checkingIn
                ? "Checking in..."
                : hasCheckedInToday
                  ? "Checked in today"
                  : "Check in"}
            </button>
          </div>
        </section>

        {error && (
          <p
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
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

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Attendance history
              </h2>
              <p className="text-sm text-slate-500">
                Your latest gym check-ins
              </p>
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
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Checked in
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <ShieldCheck
                className="mx-auto h-8 w-8 text-slate-300"
                aria-hidden="true"
              />
              <p className="mt-3 font-medium text-slate-800">
                No attendance yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your check-ins will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
