
async function updateStatus(orderId, status) {
  const { isConfirmed } = await Swal.fire({
    title: "Update Order Status?",
    text: `Change status to "${status}"`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#1d4ed8"
  });

  if (!isConfirmed) return;

  const res = await fetch(`/admin/orders/${orderId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  if (res.ok) {
    await Swal.fire("Updated!", "Order status updated", "success");
    location.reload(); 
  } else {
    Swal.fire("Error", "Could not update status", "error");
  }
}

