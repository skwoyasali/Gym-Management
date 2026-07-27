import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";


export default function AppLayout({
children
}){


return (

<div className="flex">


<Sidebar/>


<div className="flex-1">


<Topbar/>


<main className="p-6 bg-gray-100 min-h-screen">


{children}


</main>


</div>


</div>

)

}