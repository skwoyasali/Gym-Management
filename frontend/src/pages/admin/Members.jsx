import AddMemberModal from "../../components/modals/AddMemberModal";
import MemberRechargeModal from "../../components/modals/MemberRechargeModal";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Banknote,
  History,
  KeyRound,
  Pencil,
  Phone,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  createMemberActivationCode,
  deleteMember,
  getMembers,
} from "../../services/memberService";
import { getMemberRechargeHistory } from "../../services/rechargeService";
import { getPlans } from "../../services/planService";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshMembers, setRefreshMembers] = useState(0);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [invitingMemberId, setInvitingMemberId] = useState(null);
  const [activationDetails, setActivationDetails] = useState(null);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [rechargingMember, setRechargingMember] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadPlans = async () => {
    const res = await getPlans();

    return res.data.data;
  };

  useEffect(() => {
    const searchTimeout = window.setTimeout(() => {
      setAppliedSearch(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(searchTimeout);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;

    getMembers(page, 10, {
      search: appliedSearch,
      status: statusFilter === "all" ? "" : statusFilter,
      plan: planFilter,
    })
      .then((response) => {
        if (!active) return;
        setMembers(response.data.data);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Load members error:", error);
        setMembersError(
          error.response?.data?.message || "Failed to load members"
        );
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });

    return () => {
      active = false;
    };
  }, [page, appliedSearch, statusFilter, planFilter, refreshMembers]);

  useEffect(() => {

    loadPlans()
      .then(setPlans)
      .catch((error) => {
        console.error("Load plans error:", error);
        setPlansError(
          error.response?.data?.message || "Failed to load membership plans"
        );
      });
  }, []);

  const handleMemberCreated = () => {
    setLoadingMembers(true);
    setMembersError("");
    if (page !== 1) setPage(1);
    setRefreshMembers((current) => current + 1);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setShowAddModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setShowAddModal(true);
  };

  const handleMemberDeleted = async (member) => {
    const confirmed = window.confirm(
      `Delete ${member.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setActionError("");
    setDeletingMemberId(member._id);
    try {
      await deleteMember(member._id);
      setLoadingMembers(true);
      setMembersError("");
      if (members.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      }
      setRefreshMembers((current) => current + 1);
    } catch (error) {
      console.error("Delete member error:", error);
      setActionError(
        error.response?.data?.message || "Failed to delete member"
      );
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleCreateActivationCode = async (member) => {
    setActionError("");
    setInvitingMemberId(member._id);
    setCopiedCode(false);
    try {
      const response = await createMemberActivationCode(member._id);
      setActivationDetails({
        ...response.data.data,
        memberName: member.name,
      });
    } catch (error) {
      console.error("Create member activation code error:", error);
      setActionError(
        error.response?.data?.message ||
          "Unable to create the member activation code"
      );
    } finally {
      setInvitingMemberId(null);
    }
  };

  const handleViewRechargeHistory = async (member) => {
    setHistoryDetails({ member, records: [] });
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await getMemberRechargeHistory(member._id);
      setHistoryDetails({
        member: response.data.data.member,
        records: response.data.data.history,
      });
    } catch (error) {
      console.error("Load member recharge history error:", error);
      setHistoryError(
        error.response?.data?.message || "Unable to load recharge history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRechargeComplete = () => {
    setRechargingMember(null);
    setLoadingMembers(true);
    setMembersError("");
    setRefreshMembers((current) => current + 1);
    if (historyDetails) {
      handleViewRechargeHistory(historyDetails.member);
    }
  };

  const copyActivationCode = async () => {
    try {
      await navigator.clipboard.writeText(activationDetails.activationCode);
      setCopiedCode(true);
    } catch (error) {
      console.error("Copy activation code error:", error);
      setActionError("Could not copy the code. Please select and copy it.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage your gym membership roster.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add Member
        </button>
      </header>

      {plansError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {plansError}
        </p>
      )}
      {actionError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {actionError}
        </p>
      )}
      {membersError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {membersError}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">All members</h2>
              <p className="text-sm text-slate-500">
                {pagination.total}{" "}
                {pagination.total === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative block flex-1">
            <span className="sr-only">Search members by name or phone</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setLoadingMembers(true);
                setMembersError("");
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or phone number"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setLoadingMembers(true);
                setMembersError("");
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="min-w-36 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">All members</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span>Plan</span>
            <select
              value={planFilter}
              onChange={(event) => {
                setLoadingMembers(true);
                setMembersError("");
                setPlanFilter(event.target.value);
                setPage(1);
              }}
              className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">All plans</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 sm:px-6">Member</th>
                <th scope="col" className="px-5 py-3 sm:px-6">Phone</th>
                <th scope="col" className="px-5 py-3 sm:px-6">Membership plan</th>
                <th scope="col" className="px-5 py-3 sm:px-6">Status</th>
                <th scope="col" className="px-5 py-3 text-right sm:px-6">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingMembers ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading members...
                  </td>
                </tr>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <tr key={member._id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {member.name?.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-slate-900">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <a
                        href={`tel:${member.phone}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-indigo-600"
                      >
                        <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        {member.phone}
                      </a>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      {member.plan ? (
                        <div>
                          <p className="font-medium text-slate-900">
                            {member.plan.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ₹{Number(member.plan.price).toLocaleString("en-IN")}
                            {member.plan.duration
                              ? ` · ${member.plan.duration} ${
                                  member.plan.duration === 1 ? "month" : "months"
                                }`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No plan assigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          member.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.active ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <div className="inline-flex items-center gap-1">
                        {!member.userId && (
                          <button
                            type="button"
                            onClick={() => handleCreateActivationCode(member)}
                            disabled={invitingMemberId === member._id}
                            aria-label={`Create member login code for ${member.name}`}
                            title="Create member login code"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {invitingMemberId === member._id ? (
                              <span
                                className="block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600"
                                aria-label="Creating activation code"
                              />
                            ) : (
                              <KeyRound
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRechargingMember(member)}
                          disabled={Boolean(plansError) || plans.length === 0}
                          aria-label={`Recharge membership for ${member.name}`}
                          title="Recharge membership"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Banknote className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewRechargeHistory(member)}
                          aria-label={`View recharge history for ${member.name}`}
                          title="Recharge history"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-600 focus:outline-none focus:ring-4 focus:ring-violet-100"
                        >
                          <History className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          aria-label={`Edit ${member.name}`}
                          title="Edit member"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberDeleted(member)}
                          disabled={deletingMemberId === member._id}
                          aria-label={`Delete ${member.name}`}
                          title="Delete member"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingMemberId === member._id ? (
                            <span
                              className="block h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-rose-600"
                              aria-label="Deleting member"
                            />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Users className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-medium text-slate-900">
                      {searchTerm || statusFilter !== "all" || planFilter
                        ? "No matching members"
                        : "No members yet"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {searchTerm || statusFilter !== "all" || planFilter
                        ? "Try a different search or filter."
                        : "Add your first member to get started."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-sm text-slate-500">
              Page {page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoadingMembers(true);
                  setMembersError("");
                  setPage((currentPage) => currentPage - 1);
                }}
                disabled={page <= 1 || loadingMembers}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoadingMembers(true);
                  setMembersError("");
                  setPage((currentPage) => currentPage + 1);
                }}
                disabled={page >= pagination.totalPages || loadingMembers}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
      {showAddModal && (
        <AddMemberModal
          key={editingMember?._id || "new-member"}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleMemberCreated}
          member={editingMember}
        />
      )}
      {rechargingMember && (
        <MemberRechargeModal
          member={rechargingMember}
          plans={plans}
          onClose={() => setRechargingMember(null)}
          onSuccess={handleRechargeComplete}
        />
      )}
      {activationDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActivationDetails(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="activation-code-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Member login
                </p>
                <h2
                  id="activation-code-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Share this activation code
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivationDetails(null)}
                aria-label="Close activation code"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Share this one-time code with {activationDetails.memberName} at{" "}
              <strong>{activationDetails.email}</strong>. It expires in 24
              hours and can only be used once.
            </p>
            <code className="mt-5 block break-all rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-800">
              {activationDetails.activationCode}
            </code>
            <button
              type="button"
              onClick={copyActivationCode}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              {copiedCode ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copiedCode ? "Copied" : "Copy activation code"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Member opens <span className="font-medium">/activate-member</span>{" "}
              to set their password.
            </p>
          </section>
        </div>
      )}
      {historyDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setHistoryDetails(null);
              setHistoryError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-recharge-history-title"
            className="max-h-[min(85vh,800px)] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  Member profile
                </p>
                <h2
                  id="member-recharge-history-title"
                  className="mt-1 text-lg font-bold text-slate-900"
                >
                  {historyDetails.member.name}&apos;s recharge history
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistoryDetails(null);
                  setHistoryError("");
                }}
                aria-label="Close recharge history"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            {historyError && (
              <p
                className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                {historyError}
              </p>
            )}
            {historyLoading ? (
              <p className="px-6 py-12 text-center text-sm text-slate-500">
                Loading recharge history...
              </p>
            ) : historyDetails.records.length ? (
              <div className="overflow-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Plan</th>
                      <th className="px-5 py-3">Recharge date</th>
                      <th className="px-5 py-3">Start date</th>
                      <th className="px-5 py-3">Expiry date</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Payment method</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3">Approval</th>
                      <th className="px-5 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyDetails.records.map((record) => (
                      <tr key={record._id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {record.planName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.durationMonths}{" "}
                            {record.durationMonths === 1 ? "month" : "months"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {new Intl.DateTimeFormat("en", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          }).format(new Date(record.rechargedAt))}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {new Intl.DateTimeFormat("en", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          }).format(new Date(record.membershipStart))}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {new Intl.DateTimeFormat("en", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          }).format(new Date(record.membershipEnd))}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                          }).format(Number(record.amount))}
                        </td>
                        <td className="px-5 py-4 capitalize text-slate-600">
                          {record.paymentMethod?.replace("_", " ") || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              record.paymentStatus === "verified"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {record.paymentStatus === "verified"
                              ? "Verified"
                              : "Not recorded"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Approved
                          </span>
                        </td>
                        <td className="max-w-40 truncate px-5 py-4 text-slate-600">
                          {record.transactionReference || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-6 py-12 text-center text-sm text-slate-500">
                No recharge history recorded for this member yet.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
