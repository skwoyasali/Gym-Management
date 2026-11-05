import api from "./api";


export const getMembers = async (page = 1, limit = 10) => {
  return await api.get("/members", {
    params: {
      page,
      limit,
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
