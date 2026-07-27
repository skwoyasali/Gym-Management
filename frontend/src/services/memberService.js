import api from "./api";


export const getMembers = async()=>{

return await api.get("/members");

};


export const addMember = async(data)=>{

return await api.post(
"/members",
data
);

};


export const deleteMember = async(id)=>{

return await api.delete(
`/members/${id}`
);

};