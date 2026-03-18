document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
});

// REMOVE FROM WISHLIST
async function removeFromWishlist(productId) {
  try {
    const result = await Swal.fire({
      title: "Remove item?",
      text: "Are you sure you want to remove this item from your wishlist?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const response = await fetch("/wishlist/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: "Removed!",
          text: "Item removed from wishlist.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          location.reload();
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to remove item",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    Swal.fire({
      title: "Error",
      text: "Something went wrong. Please try again.",
      icon: "error",
      confirmButtonColor: "#2563eb",
    });
  }
}

// MOVE TO CART
async function moveToCart(productId, variantId) {
  try {
    if (!variantId) {
      Swal.fire({
        title: "Error",
        text: "Please select a product variant first.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const response = await fetch("/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        variantId,
        quantity: 1, // Default to 1
      }),
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        title: "Added to Cart!",
        text: "Item successfully moved to cart.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Since adding to cart also removes from wishlist backend via  updated spec, reload the page
        location.reload();
      });
    } else if (data.notLoggedIn) {
      window.location.href = "/login";
    } else {
      Swal.fire({
        title: "Error",
        text: data.message || "Failed to add to cart.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    }
  } catch (error) {
    console.error("Error moving to cart:", error);
    Swal.fire({
      title: "Error",
      text: "Something went wrong. Please try again.",
      icon: "error",
      confirmButtonColor: "#2563eb",
    });
  }
}
