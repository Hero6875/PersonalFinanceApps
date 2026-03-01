let categories = [];

async function loadCategories() {

    categories = await API.get("/categories");

    const select =
        document.getElementById("category");

    select.innerHTML = "";

    categories.forEach(c => {

        const option = document.createElement("option");

        option.value = c.id;
        option.textContent = c.name;

        select.appendChild(option);
    });
}