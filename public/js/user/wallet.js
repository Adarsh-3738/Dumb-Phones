document.addEventListener("DOMContentLoaded", () => {
  const addMoneyBtn = document.getElementById("addMoneyBtn");

  addMoneyBtn.addEventListener("click", async () => {
    const amount = prompt("Enter amount to add:");

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      const response = await fetch("/wallet/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (data.success) {
        alert("Money added successfully");
        location.reload();
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
});
