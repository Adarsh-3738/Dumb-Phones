
  const decreaseBtn = document.getElementById('decreaseQty');
  const increaseBtn = document.getElementById('increaseQty');
  const qtyInput = document.getElementById('qtyInput');
  const maxQty = parseInt(qtyInput.max);

  decreaseBtn.addEventListener('click', () => {
    let current = parseInt(qtyInput.value);
    if (current > 1) qtyInput.value = current - 1;
  });

  increaseBtn.addEventListener('click', () => {
    let current = parseInt(qtyInput.value);
    if (current < maxQty) qtyInput.value = current + 1;
  });




    //for image zoom
  const zoomContainer = document.querySelector(".image-zoom-container");
  const mainImage = document.getElementById("mainImage");

  zoomContainer.addEventListener("mousemove", (e) => {
    const rect = zoomContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    mainImage.style.transformOrigin = `${x}% ${y}%`;
  });

  zoomContainer.addEventListener("mouseleave", () => {
    mainImage.style.transformOrigin = "center center";
  });

  //for thumbnail switching
  const thumbnails = document.querySelectorAll(".thumbnail");

thumbnails.forEach(thumb => {
  thumb.addEventListener("click", () => {
    mainImage.src = thumb.src;
  });
});


// add to cart
async function addToCart(productId) {
  try {
    const res = await fetch(`/cart/add/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"   //  IMPORTANT
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

    // Error
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



