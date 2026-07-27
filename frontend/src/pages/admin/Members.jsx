import AppLayout from "../../components/layout/AppLayout";


import {
useEffect,
useState
}
from "react";


import {
getMembers
}
from "../../services/memberService";


export default function Members(){


const [members,setMembers]=useState([]);



useEffect(()=>{


loadMembers();


},[]);



const loadMembers=async()=>{


const res =
await getMembers();


setMembers(
res.data
);


}



return (

<AppLayout>


<h1 className="text-2xl font-bold">
Members
</h1>



<div className="bg-white mt-5 p-5 rounded">


<table className="w-full">


<thead>

<tr>

<th>Name</th>

<th>Phone</th>

<th>Status</th>

</tr>

</thead>



<tbody>


{
members.map(
(member)=>(


<tr key={member._id}>


<td>
{member.name}
</td>


<td>
{member.phone}
</td>


<td>
{member.active?
"Active":
"Expired"}
</td>


</tr>


)
)

}


</tbody>


</table>


</div>


</AppLayout>

)


}