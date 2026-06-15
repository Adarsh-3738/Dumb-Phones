async function toggleWishlist(productId, event) {
  let targetBtn = null;
  if (event) {
    event.preventDefault(); // Prevent navigating to product details
    event.stopPropagation();
    targetBtn = event.currentTarget; // Capture it synchronously
  }

  if (!window.user) {
    window.location.href = "/login";
    return;
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
      if (targetBtn) {
        const svg = targetBtn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', '#ef4444');
          svg.setAttribute('stroke', '#ef4444');
        }
      }
      
      // Update the wishlist count badge in the header
      const wishlistLink = document.querySelector('a[href="/wishlist"]');
      if (wishlistLink) {
        let badge = wishlistLink.querySelector('.cart-badge');
        if (badge) {
          let currentCount = parseInt(badge.innerText) || 0;
          badge.innerText = currentCount + 1;
        } else {
          badge = document.createElement('span');
          badge.className = 'cart-badge';
          badge.innerText = '1';
          wishlistLink.appendChild(badge);
        }
      }

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
