export const getMemberPhotoFilter = (user, memberId) => {
  if (
    user.role === "member" &&
    String(user.memberId) !== String(memberId)
  ) {
    return null;
  }

  return {
    _id: memberId,
    createdBy: user.tenantId || user.id,
    ...(user.role === "member" ? { userId: user.id } : {}),
  };
};

export const serializeMemberPhoto = (member) => {
  if (!member) return member;

  const result = member.toObject ? member.toObject() : { ...member };
  result.photoUrl = result.photoStorageKey
    ? `/members/${result._id}/photo`
    : null;
  delete result.photoStorageKey;
  return result;
};
