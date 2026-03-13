 async function updateStatus(orderId, status) {
      const { isConfirmed } = await Swal.fire({
        title: 'Change Order Status?',
        text: `Set order ${orderId} status to "${status}"`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, update',
        cancelButtonText: 'Cancel'
      });

      if (!isConfirmed) return;

      const res = await fetch(`/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        Swal.fire('Updated!', `Order ${orderId} status updated.`, 'success');
        setTimeout(()=>location.reload(), 1000);
      } else {
        Swal.fire('Error', 'Could not update order status.', 'error');
      }
    }
 