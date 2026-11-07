export const getRechargeTenantId = (user) => user.tenantId || user.id;

export const getOwnMemberFilter = (user) => ({
  _id: user.memberId,
  createdBy: getRechargeTenantId(user),
  userId: user.id,
});

export const getRechargeRequestFilter = (user, requestId) => ({
  _id: requestId,
  tenantId: getRechargeTenantId(user),
  ...(user.role === "member" ? { memberId: user.memberId } : {}),
});

export const getTenantRechargeRequestFilter = (user) => ({
  tenantId: getRechargeTenantId(user),
});
