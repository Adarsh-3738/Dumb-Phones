// add to cart
async function addToCart(productId) {
  try {
    const res = await fetch(`/cart/add/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"   
      },
      credentials: "same-origin"
    });

    const data = await res.json();

    // Not logged in
    if (data.notLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: data.message || "Please login to add items to cart",
        confirmButtonText: 'Login'
      }).then(() => {
        window.location.href = "/login";
      });
      return;
    }

    //  Error
    if (!data.success) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: data.message || 'Unable to add product'
      });
      return;
    }

    // Success
    Swal.fire({
      icon: 'success',
      title: 'Added to Cart!',
      text: 'Product successfully added to your cart',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "/cart";
    });

  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Server Error',
      text: 'Please try again later'
    });
  }
}
