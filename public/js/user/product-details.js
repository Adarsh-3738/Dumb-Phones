// VARIANT DATA 
const variants = window.variants; // injected from EJS
let selectedVariantIndex = 0;

// ELEMENTS 
const decreaseBtn = document.getElementById("decreaseQty");
const increaseBtn = document.getElementById("increaseQty");
const qtyInput = document.getElementById("qtyInput");
const variantSelect = document.getElementById("variantSelect");

const mainImage = document.getElementById("mainImage");
const thumbnailRow = document.getElementById("thumbnailRow");
const regularPrice = document.getElementById("regularPrice");
const salesPrice = document.getElementById("salesPrice");
const stockText = document.getElementById("stockText");

// INIT 
updateVariantUI(0);

// VARIANT CHANGE 
variantSelect.addEventListener("change", () => {
  selectedVariantIndex = parseInt(variantSelect.value);
  updateVariantUI(selectedVariantIndex);
});

// UPDATE UI 
function updateVariantUI(index) {
  const variant = variants[index];

  // Prices
  regularPrice.innerText = `₹ ${variant.regularPrice}`;
  salesPrice.innerText = `₹ ${variant.salesPrice}`;

  // Stock
  if (variant.quantity > 0) {
    stockText.innerText = `In Stock: ${variant.quantity}`;
    stockText.className = "in-stock";
    qtyInput.value = 1;
    qtyInput.max = Math.min(variant.quantity, 5);

  } else {
    stockText.innerText = "Out of Stock";
    stockText.className = "out-of-stock";
    qtyInput.value = 0;
    qtyInput.max = 0;
  }

  // MAIN IMAGE
  mainImage.src = variant.variantImages?.[0]?.url
    ? `${variant.variantImages[0].url}`
    : "/images/no-image.png";

  //  THUMBNAILS
  thumbnailRow.innerHTML = "";

  variant.variantImages.forEach(img => {
    const thumb = document.createElement("img");
    thumb.src = `${img.url}`;
    thumb.className = "thumbnail";

    thumb.addEventListener("click", () => {
      mainImage.src = `${img.url}`;
    });

    thumbnailRow.appendChild(thumb);
  });
}

// QUANTITY CONTROLS
decreaseBtn.addEventListener("click", () => {
  let current = parseInt(qtyInput.value);
  
  if (current > 1) {
    qtyInput.value = current - 1;
  } else {
    // If they try to go below 1, show the alert
    Swal.fire({
      icon: 'warning',
      title: 'Minimum Quantity',
      text: 'You must select at least 1 unit to add to your cart.',
      timer: 2000, 
      showConfirmButton: false // Automatically closes after 2 seconds
    });
  }
});


increaseBtn.addEventListener("click", () => {
  let current = parseInt(qtyInput.value);
  let max = parseInt(qtyInput.max); // This is automatically either the stock or  new 5 limit!
  
  if (current < max) {
    qtyInput.value = current + 1;
  } else {
    // If  hit the limit
    if (max >= 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum Limit Reached',
        text: 'You can only buy up to 5 units of this item per order.'
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Low Stock',
        text: `Only ${max} units are currently available in stock.`
      });
    }
  }
});

// IMAGE ZOOM 
const zoomContainer = document.querySelector(".image-zoom-container");

zoomContainer.addEventListener("mousemove", e => {
  const rect = zoomContainer.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  mainImage.style.transformOrigin = `${x}% ${y}%`;
});

zoomContainer.addEventListener("mouseleave", () => {
  mainImage.style.transformOrigin = "center center";
});

// ADD TO CART 
async function addToCart() {
  const variant = variants[selectedVariantIndex];
  const quantity = parseInt(qtyInput.value);

  if (variant.quantity === 0) {
    Swal.fire("Out of Stock", "This variant is unavailable", "warning");
    return;
  }

  try {
    const res = await fetch("/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        productId: variant.productId,
        variantId: variant._id,
        quantity
      })
    });

    const data = await res.json();

    if (data.notLoggedIn) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: data.message
      }).then(() => {
        window.location.href = "/login";
      });
      return;
    }

    if (!data.success) {
      Swal.fire("Error", data.message || "Unable to add product", "error");
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Added to Cart!",
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "/cart";
    });

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Server error", "error");
  }
}

// TOGGLE WISHLIST
async function toggleWishlist(productId) {
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
