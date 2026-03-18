
async function updateQty(variantId, action) {
  try {
    const res = await fetch(`/cart/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ variantId })
    });

    const data = await res.json();

    if (!data.success) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: data.message || "Quantity limit reached",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    location.reload();

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Please try again later"
    });
  }
}

async function removeItem(variantId) {
  Swal.fire({
    title: "Are you sure?",
    text: "This item will be removed from your cart",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove it",
    cancelButtonText: "Cancel"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch("/cart/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ variantId })
        });

        const data = await res.json();

        if (!data.success) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message || "Unable to remove item"
          });
          return;
        }

        Swal.fire({
          icon: "success",
          title: "Removed!",
          timer: 1000,
          showConfirmButton: false
        }).then(() => location.reload());

      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text: "Please try again later"
        });
      }
    }
  });
}