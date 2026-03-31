
async function updateStatus(orderId, newStatus, currentStatus, selectElement) {
  if (currentStatus === "Cancelled" && newStatus !== "Cancelled") {
    Swal.fire("Not Allowed", "Cannot change the status of a cancelled order.", "error");
    if (selectElement) selectElement.value = currentStatus;
    return;
  }
  
  if (currentStatus === "Delivered" && newStatus === "Cancelled") {
    Swal.fire("Not Allowed", "Cannot cancel an order that has already been delivered.", "error");
    if (selectElement) selectElement.value = currentStatus;
    return;
  }
  
  if (currentStatus === "Returned" && newStatus !== "Returned") {
    Swal.fire("Not Allowed", "Cannot change the status of a returned order.", "error");
    if (selectElement) selectElement.value = currentStatus;
    return;
  }

  const { isConfirmed } = await Swal.fire({
    title: "Update Order Status?",
    text: `Change status to "${newStatus}"`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#1d4ed8"
  });

  if (!isConfirmed) {
    if (selectElement) selectElement.value = currentStatus;
    return;
  }

  try {
    const res = await fetch(`/admin/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await res.json();

    if (res.ok && data.success) {
      await Swal.fire("Updated!", "Order status updated", "success");
      location.reload(); 
    } else {
      Swal.fire("Error", data.message || "Could not update status", "error");
      if (selectElement) selectElement.value = currentStatus;
    }
  } catch (err) {
    Swal.fire("Error", "Server failed to process request.", "error");
    if (selectElement) selectElement.value = currentStatus;
  }
}

