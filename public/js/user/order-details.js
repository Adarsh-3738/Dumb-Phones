 
    
async function cancelOrder(orderId) {
  const { value: reason } = await Swal.fire({
    title: "Cancel Order?",
    text: "You can provide a reason (optional)",
    input: "text",
    inputPlaceholder: "Reason (optional)",
    showCancelButton: true,
    confirmButtonText: "Cancel Order",
    confirmButtonColor: "#1e40af",
    cancelButtonColor: "#d33"
  });

  if (reason === undefined) return;

  await fetch(`/orders/${orderId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });

  Swal.fire({
    icon: "success",
    title: "Order Cancelled",
    timer: 1500,
    showConfirmButton: false
  });

  setTimeout(() => location.reload(), 1500);
}

// CANCEL SINGLE ITEM
async function cancelOrderItem(orderId, itemId) {
  const { value: reason } = await Swal.fire({
    title: "Cancel Item?",
    text: "You can provide a reason (optional)",
    input: "text",
    inputPlaceholder: "Reason (optional)",
    showCancelButton: true,
    confirmButtonText: "Cancel Item",
    confirmButtonColor: "#1e40af",
    cancelButtonColor: "#d33"
  });

  if (reason === undefined) return;

  try {
    const res = await fetch(`/orders/${orderId}/item/${itemId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Item Cancelled",
        timer: 1500,
        showConfirmButton: false
      });
      setTimeout(() => location.reload(), 1500);
    } else {
      Swal.fire("Error", data.message || "Failed to cancel item", "error");
    }
  } catch (error) {
    Swal.fire("Error", "Server error", "error");
  }
}

    async function returnOrder(orderId) {
      const { value: reason } = await Swal.fire({
        title: "Return Order",
        input: "textarea",
        inputLabel: "Reason for return",
        inputPlaceholder: "Enter your reason here...",
        inputAttributes: { maxlength: 200 },
        showCancelButton: true,
        confirmButtonText: "Submit",
        confirmButtonColor: "#1d4ed8",
        cancelButtonText: "Cancel",
        inputValidator: (value) => {
          if (!value) return "Reason is required!";
        }
      });

      if (!reason) return;

      try {
        const res = await fetch(`/orders/${orderId}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });

        if (res.ok) {
          await Swal.fire({
            icon: "success",
            title: "Return Requested",
            text: "Your return request has been submitted.",
            confirmButtonColor: "#1d4ed8"
          });
          location.reload();
        } else {
          throw new Error("Return failed");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Could not submit return request."
        });
      }
    }
 