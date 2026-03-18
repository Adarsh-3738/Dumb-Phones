async function toggleWishlist(productId, event) {
  if (event) {
    event.preventDefault(); // Prevent navigating to product details
    event.stopPropagation();
  }
  
  try {
    const response = await fetch("/wishlist/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        title: "Added to Wishlist",
        text: "Item successfully added to your wishlist.",
        icon: "success",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } else if (data.notLoggedIn) {
      window.location.href = "/login";
    } else {
      Swal.fire({
        title: "Notice",
        text: data.message || "Failed to add to wishlist.",
        icon: "info",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000
      });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    Swal.fire({
      title: "Error",
      text: "Something went wrong. Please try again.",
      icon: "error",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 3000
    });
  }
}
