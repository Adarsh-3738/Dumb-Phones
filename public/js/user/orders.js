
function goToOrder(orderId) {
  window.location.href = `/orders/${orderId}`;
}
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

  Swal.fire({ icon: "success", title: "Order Cancelled", timer: 1500, showConfirmButton: false });
  setTimeout(() => location.reload(), 1500);
}
async function returnOrder(orderId) {
  const { value: reason } = await Swal.fire({
    title: "Return Order",
    input: "textarea",
    inputLabel: "Reason for return",
    inputPlaceholder: "Enter your reason here...",
    showCancelButton: true,
    confirmButtonText: "Submit",
    confirmButtonColor: "#1e40af",
    inputValidator: (value) => { if (!value) return "Reason is required!"; }
  });

  if (!reason) return;

  await fetch(`/orders/${orderId}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });

  Swal.fire({ icon: "success", title: "Return Requested", confirmButtonColor: "#1e40af" });
  location.reload();
}
