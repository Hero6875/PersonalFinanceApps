let modal =
 new bootstrap.Modal(
 document.getElementById('categoryModal')
 );

async function loadCategories(){

    const data =
        await API.get("/categories");

    const table =
        document.getElementById(
            "categoryTable"
        );

    table.innerHTML="";

    data.forEach(c=>{

        table.innerHTML+=`
        <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>

            <button
            class="btn btn-warning btn-sm"
            onclick="editCategory(${c.id},
            '${c.name}')">
            Edit
            </button>

            <button
            class="btn btn-danger btn-sm"
            onclick="deleteCategory(${c.id})">
            Delete
            </button>

            </td>
        </tr>`;
    });
}

function openAddModal(){

    document.getElementById(
        "categoryId").value="";

    document.getElementById(
        "categoryName").value="";

    modal.show();
}

function editCategory(id,name){

    document.getElementById(
        "categoryId").value=id;

    document.getElementById(
        "categoryName").value=name;

    modal.show();
}

async function saveCategory(){

    const id =
        document.getElementById(
            "categoryId").value;

    const name =
        document.getElementById(
            "categoryName").value;

    if(id===""){
        await API.post(
            "/categories",
            {name}
        );
    }
    else{
        await API.put(
            `/categories/${id}`,
            {name}
        );
    }

    modal.hide();
    loadCategories();
}

async function deleteCategory(id){

    if(confirm("Delete this category?")){

        await API.delete(
            `/categories/${id}`
        );

        loadCategories();
    }
}

loadCategories();