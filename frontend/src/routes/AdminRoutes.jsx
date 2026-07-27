import {
Routes,
Route
}
from "react-router-dom";


import Dashboard from "../pages/admin/Dashboard";
import Members from "../pages/admin/Members";


import ProtectedRoute from "./ProtectedRoute";


export default function AdminRoutes(){


return (

<ProtectedRoute>


<Routes>


<Route 
path="dashboard"
element={<Dashboard/>}
/>


<Route 
path="members"
element={<Members/>}
/>


</Routes>


</ProtectedRoute>


)

}