import {
createSlice
}
from "@reduxjs/toolkit";


const memberSlice=createSlice({

name:"members",

initialState:{

list:[]

},


reducers:{


setMembers:(state,action)=>{

state.list=action.payload;

},


addMember:(state,action)=>{

state.list.push(action.payload);

},


removeMember:(state,action)=>{

state.list =
state.list.filter(
m=>m._id!==action.payload
)

}

}


})


export const {

setMembers,

addMember,

removeMember

}=memberSlice.actions;


export default memberSlice.reducer;