document.addEventListener("DOMContentLoaded", () => {
  const addMoneyBtn = document.getElementById("addMoneyBtn");

  addMoneyBtn.addEventListener("click", async () => {
    const { value: amount } = await Swal.fire({
      title: 'Top-Up Wallet',
      input: 'number',
      inputLabel: 'Enter amount to add securely (Min: ₹100)',
      inputPlaceholder: 'e.g. 500',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || isNaN(value) || Number(value) < 100) {
          return 'Please enter a valid amount of at least ₹100';
        }
      }
    });

    if (!amount) return;

    try {
      //Backend to Generate the Order
      const res = await fetch("/wallet/add/razorpay-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        return Swal.fire("Top-Up Failed", data.message, "error");
      }

      // Open the Razorpay Popup
      const options = {
        key: data.key, 
        amount: Math.round(data.amount * 100),
        currency: "INR",
        name: "DumbPhones",
        description: "Wallet Top-Up",
        order_id: data.razorpayOrderId,
        
        handler: async function (response) {
          // Verify Signature
          const verifyRes = await fetch("/wallet/add/razorpay-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: data.amount
            })
          });

          const verifyData = await verifyRes.json();
          
          if (verifyData.success) {
             await Swal.fire("Success!", verifyData.message, "success");
             location.reload();
          } else {
             Swal.fire("Verification Failed", verifyData.message, "error");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com" 
        },
        theme: { color: "#0f172a" } 
      };

      const rzp = new Razorpay(options);
      
      rzp.on('payment.failed', function (response){
        Swal.fire("Payment Failed", "Transaction was incomplete.", "warning");
      });

      rzp.open();

    } catch (err) {
      console.error(err);
      Swal.fire("System Error", "Could not initialize payment module.", "error");
    }
  });
});
