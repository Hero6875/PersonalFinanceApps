async function save(){

await fetch("/addTransaction",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:type.value,
category:category.value,
amount:amount.value,
note:note.value,
date:new Date().toISOString().split("T")[0]
})
});

load();
}

/* LOAD DATA */

async function load(){

const res =
await fetch("/transactions");

const data =
await res.json();

const list =
document.getElementById("transactionList");

list.innerHTML="";

data.forEach(t=>{
const li=document.createElement("li");

li.innerText =
`${t.TransactionDate}
 - ${t.Category}
 - ${t.Amount}`;

list.appendChild(li);
});
}

load();
