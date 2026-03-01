

const API = {

        async get(url) {

        const res = await fetch(url);

        if (!res.ok)
            throw new Error("API Error");

        const text = await res.text();

        try {
            return JSON.parse(text);
        } catch {
            console.error("Not JSON:", text);
            throw new Error("Invalid JSON response");
        }
    },

    async post(url, data){

        const res = await fetch(url,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        });

        if(!res.ok){

            const text = await res.text();
            console.error(
                "Server returned:",
                text
            );

            throw new Error(
                "Server Error"
            );
        }

        return res.json();
    }
};

window.API = API;
