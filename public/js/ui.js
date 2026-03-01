// public/js/ui.js
// Safe UI event controller (single initUIEvents, uses s_... ids for schedule form)

function initUIEvents() {
  console.log("✅ UI Events Initialized");

  // --------------------------
  // Transaction Form
  // --------------------------
  const transactionForm = document.getElementById("transactionForm");
  if (transactionForm) {
    transactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Transaction submit");

      if (typeof saveTransaction === "function") {
        try {
          await saveTransaction(e);
          await loadTransactions();
          loadExpenseChart();
        } catch (err) {
          console.error("saveTransaction error:", err);
          alert("Saving transaction failed — check console.");
        }
      } else {
        console.error("saveTransaction is not defined");
      }
    });
  }

  // --------------------------
  // Schedule Form (uses s_... ids)
  // --------------------------
  const scheduleForm = document.getElementById("scheduleForm");
  if (scheduleForm) {
    scheduleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("✅ Schedule form submitted");

      const data = {
        title: document.getElementById("s_title")?.value || "",
        amount: document.getElementById("s_amount")?.value || "",
        type: document.getElementById("s_type")?.value || "expense",
        category_id: document.getElementById("s_category")?.value || null,
        start_date: document.getElementById("s_start")?.value || null,
        end_date: document.getElementById("s_end")?.value || null,
        frequency: document.getElementById("s_frequency")?.value || "monthly"
      };

      console.log("Sending schedule:", data);

      if (!data.title || !data.amount || !data.start_date) {
        alert("Please fill Title, Amount and Start Date.");
        return;
      }

      try {
        const res = await fetch("/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server ${res.status}: ${text}`);
        }

        const json = await res.json();
        console.log("Server response:", json);
        alert("✅ Schedule created");
        scheduleForm.reset();

      } catch (err) {
        console.error("Schedule save error:", err);
        alert("Failed to create schedule — check console for details.");
      }
    });
  }

  const monthSelector =
        document.getElementById(
            "monthSelector"
        );

    // ===== MONTH CHANGE EVENT =====
    monthSelector.addEventListener(
        "change",
        () => {

            const month =
                monthSelector.value;

            console.log(
                "Month changed:",
                month
            );

            loadMonthlyStatus(month);

        }
    );

  console.log("UI ready");
}