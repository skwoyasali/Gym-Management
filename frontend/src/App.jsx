import {
Routes,
Route
} from "react-router-dom";


import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminRoutes from "./routes/AdminRoutes";
import MemberRoutes from "./routes/MemberRoutes";


function App(){

return (

<Routes>


<Route path="/login" element={<Login/>}/>

<Route path="/register" element={<Register/>}/>


<Route 
path="/admin/*"
element={<AdminRoutes/>}
/>


<Route 
path="/member/*"
element={<MemberRoutes/>}
/>


</Routes>

)

}


export default App;