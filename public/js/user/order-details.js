 
    
async function cancelOrder(orderId) {
  const { value: reason } = await Swal.fire({
    title: "Cancel Order?",
    html: `
      <p style="margin-bottom: 15px;">Please select a reason for cancellation</p>
      <select id="swal-select" class="swal2-select" style="display: flex; margin: 10px auto; width: 80%;">
        <option value="" disabled selected>Select a reason</option>
        <option value="Changed my mind">Changed my mind</option>
        <option value="Found a better price elsewhere">Found a better price elsewhere</option>
        <option value="Ordered by mistake">Ordered by mistake</option>
        <option value="Shipping time is too long">Shipping time is too long</option>
        <option value="Other">Other</option>
      </select>
      <textarea id="swal-textarea" class="swal2-textarea" placeholder="Type your reason here..." style="display: none; margin: 10px auto; width: 80%;"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: "Cancel Order",
    confirmButtonColor: "#1e40af",
    cancelButtonColor: "#d33",
    didOpen: () => {
      const select = document.getElementById('swal-select');
      const textarea = document.getElementById('swal-textarea');
      select.addEventListener('change', () => {
        if (select.value === 'Other') {
          textarea.style.display = 'flex';
          textarea.focus();
        } else {
          textarea.style.display = 'none';
        }
      });
    },
    preConfirm: () => {
      const select = document.getElementById('swal-select');
      const textarea = document.getElementById('swal-textarea');
      if (!select.value) {
        Swal.showValidationMessage("You need to select a reason");
        return false;
      }
      if (select.value === 'Other') {
        if (!textarea.value.trim()) {
          Swal.showValidationMessage("You need to write something!");
          return false;
        }
        return textarea.value.trim();
      }
      return select.value;
    }
  });

  if (!reason) return;

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
    html: `
      <p style="margin-bottom: 15px;">Please select a reason to cancel this item</p>
      <select id="swal-select" class="swal2-select" style="display: flex; margin: 10px auto; width: 80%;">
        <option value="" disabled selected>Select a reason</option>
        <option value="Changed my mind">Changed my mind</option>
        <option value="Found a better price elsewhere">Found a better price elsewhere</option>
        <option value="Ordered by mistake">Ordered by mistake</option>
        <option value="Shipping time is too long">Shipping time is too long</option>
        <option value="Other">Other</option>
      </select>
      <textarea id="swal-textarea" class="swal2-textarea" placeholder="Type your reason here..." style="display: none; margin: 10px auto; width: 80%;"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: "Cancel Item",
    confirmButtonColor: "#1e40af",
    cancelButtonColor: "#d33",
    didOpen: () => {
      const select = document.getElementById('swal-select');
      const textarea = document.getElementById('swal-textarea');
      select.addEventListener('change', () => {
        if (select.value === 'Other') {
          textarea.style.display = 'flex';
          textarea.focus();
        } else {
          textarea.style.display = 'none';
        }
      });
    },
    preConfirm: () => {
      const select = document.getElementById('swal-select');
      const textarea = document.getElementById('swal-textarea');
      if (!select.value) {
        Swal.showValidationMessage("You need to select a reason");
        return false;
      }
      if (select.value === 'Other') {
        if (!textarea.value.trim()) {
          Swal.showValidationMessage("You need to write something!");
          return false;
        }
        return textarea.value.trim();
      }
      return select.value;
    }
  });

  if (!reason) return;

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
        html: `
          <p style="margin-bottom: 15px;">Please select a reason for returning this order</p>
          <select id="swal-select" class="swal2-select" style="display: flex; margin: 10px auto; width: 80%;">
            <option value="" disabled selected>Select a reason</option>
            <option value="Defective or Damaged product">Defective or Damaged product</option>
            <option value="Received wrong item">Received wrong item</option>
            <option value="Product doesn't match description">Product doesn't match description</option>
            <option value="Performance or Quality issues">Performance or Quality issues</option>
            <option value="Other">Other</option>
          </select>
          <textarea id="swal-textarea" class="swal2-textarea" placeholder="Type your reason here..." style="display: none; margin: 10px auto; width: 80%;"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: "Submit Return",
        confirmButtonColor: "#1d4ed8",
        cancelButtonText: "Cancel",
        didOpen: () => {
          const select = document.getElementById('swal-select');
          const textarea = document.getElementById('swal-textarea');
          select.addEventListener('change', () => {
            if (select.value === 'Other') {
              textarea.style.display = 'flex';
              textarea.focus();
            } else {
              textarea.style.display = 'none';
            }
          });
        },
        preConfirm: () => {
          const select = document.getElementById('swal-select');
          const textarea = document.getElementById('swal-textarea');
          if (!select.value) {
            Swal.showValidationMessage("You need to select a reason");
            return false;
          }
          if (select.value === 'Other') {
            if (!textarea.value.trim()) {
              Swal.showValidationMessage("You need to write something!");
              return false;
            }
            return textarea.value.trim();
          }
          return select.value;
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

async function returnOrderItem(orderId, itemId) {
  const { value: reason } = await Swal.fire({
    title: "Return Item?",
    html: `
      <p style="margin-bottom: 15px;">Please select a reason for returning this specific item</p>
      <select id="swal-select" class="swal2-select" style="display: flex; margin: 10px auto; width: 80%;">
        <option value="" disabled selected>Select a reason</option>
        <option value="Defective or Damaged product">Defective or Damaged product</option>
        <option value="Received wrong item">Received wrong item</option>
        <option value="Product doesn't match description">Product doesn't match description</option>
        <option value="Performance or Quality issues">Performance or Quality issues</option>
        <option value="Other">Other</option>
      </select>
      <textarea id="swal-textarea" class="swal2-textarea" placeholder="Type your reason here..." style="display: none; margin: 10px auto; width: 80%;"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: "Return Item",
    confirmButtonColor: "#b45309",
    cancelButtonText: "Cancel",
    didOpen: () => {
      const select = document.getElementById('swal-select');
      const textarea = document.getElementById('swal-textarea');
      select.addEventListener('change', () => {
        if (select.value === 'Other') {
          textarea.style.display = 'flex';
          textarea.focus();
        } else {
          textarea.style.display = 'none';
        }
      });
    },
    preConfirm: () => {
      const select = document.getElementById('swal-select');
      const textarea = document.getElementById('swal-textarea');
      if (!select.value) {
        Swal.showValidationMessage("You need to select a reason to return.");
        return false;
      }
      if (select.value === 'Other') {
        if (!textarea.value.trim()) {
          Swal.showValidationMessage("You need to write something!");
          return false;
        }
        return textarea.value.trim();
      }
      return select.value;
    }
  });

  if (!reason) return;

  try {
    const res = await fetch(`/orders/${orderId}/item/${itemId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Item Return Requested",
        text: "Your return request has been submitted for this item.",
        confirmButtonColor: "#b45309"
      }).then(() => location.reload());
    } else {
      Swal.fire("Error", data.message || "Return failed", "error");
    }
  } catch (err) {
    Swal.fire("Error", "Could not process return request.", "error");
  }
}


async function retryPayment(orderId) {
  try {
    const res = await fetch("/checkout/razorpay-retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    });
    
    const data = await res.json();
    
    if (!data.success) {
      return Swal.fire("Retry Failed", data.message, "error");
    }

    const options = {
      key: data.key, 
      amount: Math.round(data.amount * 100),
      currency: "INR",
      name: "DumbPhones",
      description: "Order Payment Retry",
      order_id: data.razorpayOrderId,
      
      handler: async function (response) {
        const verifyRes = await fetch("/checkout/razorpay-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            systemOrderId: data.systemOrderId
          })
        });

        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
           Swal.fire({
             title: "Payment Successful",
             text: "Your payment has been successfully recorded.",
             icon: "success",
             timer: 1500,
             showConfirmButton: false
           }).then(() => {
             window.location.href = `/order-success?orderId=${data.systemOrderId}`;
           });
        } else {
           Swal.fire("Verification Failed", "Payment was tampered with.", "error");
        }
      },
      theme: { color: "#0f172a" },
      modal: {
        ondismiss: function() {
           window.location.href = `/order-failed?orderId=${data.systemOrderId}`;
        }
      }
    };

    const rzp = new Razorpay(options);
    
    rzp.on('payment.failed', function (response){
      Swal.fire("Payment Failed", "Please try again or select another method.", "error").then(() => {
        window.location.href = `/order-failed?orderId=${data.systemOrderId}`;
      });
    });

    rzp.open();

  } catch (err) {
    console.error(err);
    Swal.fire("System Error", "Could not initialize payment module.", "error");
  }
}
 