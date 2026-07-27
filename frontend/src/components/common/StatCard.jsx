export default function StatCard({
title,
value
}){


return (

<div className="
bg-white
shadow
rounded
p-5
">


<p className="text-gray-500">
{title}
</p>


<h1 className="text-3xl font-bold">
{value}
</h1>


</div>


)

}