import AppLayout from "../../components/layout/AppLayout";

import StatCard from "../../components/common/StatCard";


export default function Dashboard(){


return (

<AppLayout>


<h1 className="text-3xl font-bold mb-5">
Dashboard
</h1>


<div className="grid grid-cols-3 gap-5">


<StatCard
title="Total Members"
value="250"
/>


<StatCard
title="Active Plans"
value="180"
/>


<StatCard
title="Revenue"
value="₹85000"
/>


</div>


</AppLayout>

)

}