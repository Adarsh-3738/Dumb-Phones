
  // IMAGE CROPPER
  let cropper;
  let selectedFiles = [];
  let croppedFiles = [];
  let currentIndex = 0;

  const imageInput = document.getElementById("imageInput");

  imageInput.addEventListener("change", (e) => {
    selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length < 1) {
      alert("Select at least 1 image");
      imageInput.value = "";
      return;
    }

    currentIndex = 0;
    croppedFiles = [];
    cropImage(selectedFiles[currentIndex]);
  });

  function cropImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.src = reader.result;
      img.style.display = "none";
      document.body.appendChild(img);

      if (cropper) cropper.destroy();
      cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 2,
        autoCropArea: 1,
        ready() {
          const blob = cropper.getCroppedCanvas({ width: 600, height: 600 }).toBlob((b) => {
            const f = new File([b], file.name, { type: "image/jpeg" });
            croppedFiles.push(f);
            currentIndex++;
            cropper.destroy();
            img.remove();

            if (currentIndex < selectedFiles.length) cropImage(selectedFiles[currentIndex]);
            else finalizeFiles();
          });
        }
      });
    };
    reader.readAsDataURL(file);
  }

  function finalizeFiles() {
    const dt = new DataTransfer();
    croppedFiles.forEach(f => dt.items.add(f));
    imageInput.files = dt.files;
    showToast("Images ready for upload!");
  }

  // --- REMOVE IMAGE ---
  async function removeImage(productId, publicId, btn) {
    const existingImages = document.querySelectorAll(".image-box");
    if (existingImages.length <= 1) {
      alert("Cannot remove the last image!");
      return;
    }

    if (!confirm("Remove this image?")) return;

    const res = await fetch("/admin/products/remove-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, publicId })
    });

   const data = await res.json();

if (data.success) {
  btn.parentElement.remove();
  showToast("Image removed");
} else {
  alert("Failed to remove image");
}

  }

  // TOAST NOTIFICATION
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }



//for not getting negative value
  const form = document.getElementById("editProductForm");

  form.addEventListener("submit", function(e) {
    const regularPrice = parseFloat(form.regularPrice.value);
    const salesPrice = parseFloat(form.salesPrice.value);
    const quantity = parseInt(form.quantity.value, 10);

    if (regularPrice <= 0 || salesPrice <= 0 || quantity <= 0) {
      e.preventDefault();
      alert("Price and Quantity cannot be negative or zero");
    }
  });

