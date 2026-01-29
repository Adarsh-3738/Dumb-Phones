
async function updateQty(productId, action) {
  try {
    const res = await fetch(`/cart/${action}/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin"
    });

    const data = await res.json();

    if (!data.success) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: data.message || 'Quantity limit reached or product unavailable'
      });
      return;
    }

    location.reload();

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Server Error',
      text: 'Please try again later'
    });
  }
}

async function removeItem(productId) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This item will be removed from your cart',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remove it',
    cancelButtonText: 'Cancel'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/cart/remove/${productId}`, {
          method: "POST",
          credentials: "same-origin"
        });

        const data = await res.json();

        if (!data.success) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'Unable to remove item'
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'Item removed from cart',
          timer: 1200,
          showConfirmButton: false
        }).then(() => {
          location.reload();
        });

      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Server Error',
          text: 'Please try again later'
        });
      }
    }
  });
}
