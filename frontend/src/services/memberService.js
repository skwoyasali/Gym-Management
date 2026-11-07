import api from "./api";


export const getMembers = async (page = 1, limit = 10, filters = {}) => {
  return await api.get("/members", {
    params: {
      page,
      limit,
      search: filters.search || undefined,
      status: filters.status || undefined,
      plan: filters.plan || undefined,
    },
  });
};



export const createMember = async (memberData) => { return await api.post("/members", memberData); };

export const updateMember = async (id, memberData) => {
  return await api.put(`/members/${id}`, memberData);
};

export const deleteMember = async (id) => {
  return await api.delete(`/members/${id}`);
};

export const createMemberActivationCode = async (id) => {
  return await api.post(`/members/${id}/activation-code`);
};
