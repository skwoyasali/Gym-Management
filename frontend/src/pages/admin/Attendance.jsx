import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Users } from "lucide-react";
import { getTenantAttendance } from "../../services/attendanceService";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Attendance() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getTenantAttendance(date)
      .then((response) => {
        if (active) setRecords(response.data.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load attendance records"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [date]);

  const handleDateChange = (event) => {
    setLoading(true);
    setError("");
    setDate(event.target.value);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Gym operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Attendance
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Member check-ins recorded for your gym.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <CalendarDays
            className="h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <span className="sr-only">Attendance date</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={handleDateChange}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
          />
        </label>
      </header>

      {error && (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Check-ins</h2>
            <p className="text-sm text-slate-500">
              {loading ? "Loading..." : `${records.length} check-ins`}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            Loading attendance...
          </p>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 sm:px-6">Member</th>
                  <th scope="col" className="px-5 py-3 sm:px-6">Phone</th>
                  <th scope="col" className="px-5 py-3 sm:px-6">Check-in time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-medium text-slate-900 sm:px-6">
                      {record.memberId?.name || "Member record unavailable"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                      {record.memberId?.phone || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                      <span className="inline-flex items-center gap-2">
                        <Clock3
                          className="h-4 w-4 text-slate-400"
                          aria-hidden="true"
                        />
                        {new Intl.DateTimeFormat(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(record.checkedInAt))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Clock3
              className="mx-auto h-8 w-8 text-slate-300"
              aria-hidden="true"
            />
            <p className="mt-3 font-medium text-slate-900">No check-ins</p>
            <p className="mt-1 text-sm text-slate-500">
              No members have recorded attendance on this date.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
