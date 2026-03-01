// Data service for Monthly Status dashboard (safe, returns [] on failure)

async function loadMonthlyStatus(month) {

    const list =
        document.getElementById(
            "monthlyStatusList"
        );

    list.innerHTML = "Loading...";

    try {

        const res =
            await fetch(
                `/monthly-status?month=${month}`
            );

        const data = await res.json();

        console.log("Monthly Data:", data);

        renderMonthlyStatusList(data);

    } catch (err) {

        console.error(err);
        list.innerHTML =
            "Failed loading data";
    }
}

// markInstallmentPaid talks to backend to create transaction + move next_due_date
// returns true on success, false on failure
async function markInstallmentPaid(scheduleId, month) {
    if (!scheduleId || !month) {
        console.error("markInstallmentPaid missing args");
        return false;
    }

    try {
        const res = await fetch("/mark-paid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule_id: scheduleId, month })
        });

        if (!res.ok) {
            console.error("markInstallmentPaid HTTP error:", res.status, await res.text());
            return false;
        }

        const json = await res.json();
        if (json && (json.success === true || json.message === "Already paid")) {
            return true;
        }

        console.warn("markInstallmentPaid unexpected response:", json);
        return !!(json && json.success);
    } catch (err) {
        console.error("markInstallmentPaid error:", err);
        return false;
    }
}

function renderMonthlyStatusList(data) {

    const list =
        document.getElementById(
            "monthlyStatusList"
        );

    list.innerHTML = "";

    data.forEach(item => {

        const percent =
            (item.paid_amount /
                item.amount) * 100;

        const div =
            document.createElement("div");

        div.className = "payment-card";

        div.innerHTML = `
            <h4>${item.title}</h4>

            Total: ${item.amount}<br>
            Paid: ${item.paid_amount}<br>
            Remaining: ${item.remain_amount}

            <div class="progress-bar">
                <div class="progress"
                     style="width:${percent}%">
                </div>
            </div>

            <input
                type="number"
                placeholder="Pay amount"
                id="pay-${item.id}"
            />

            <button
                onclick="payPartial(${item.id})">
                Pay
            </button>
        `;

        list.appendChild(div);
    });
}


async function payPartial(id) {

    const input =
        document.getElementById(
            `pay-${id}`
        );

    const amount =
        Number(input.value);

    if (!amount || amount <= 0) {
        alert("Invalid payment");
        return;
    }

    await fetch(
        `/scheduled/pay/${id}`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                payAmount: amount
            })
        }
    );

    const month =
        document.getElementById(
            "monthSelector"
        ).value;

    loadMonthlyStatus(month);
}
