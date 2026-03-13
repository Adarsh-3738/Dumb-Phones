// IMAGE CROPPER
let cropper;
let selectedFiles = [];
let croppedFiles = [];
let currentIndex = 0;

const imageInput = document.getElementById("imageInput");

if (imageInput) {
  imageInput.addEventListener("change", (e) => {
    selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length < 1) {
      Swal.fire({
        icon: "warning",
        title: "No Image Selected",
        text: "Please select at least 1 image."
      });

      imageInput.value = "";
      return;
    }

    currentIndex = 0;
    croppedFiles = [];
    cropImage(selectedFiles[currentIndex]);
  });
}

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
        cropper
          .getCroppedCanvas({ width: 600, height: 600 })
          .toBlob((blob) => {

            const f = new File([blob], file.name, { type: "image/jpeg" });
            croppedFiles.push(f);

            currentIndex++;
            cropper.destroy();
            img.remove();

            if (currentIndex < selectedFiles.length) {
              cropImage(selectedFiles[currentIndex]);
            } else {
              finalizeFiles();
            }

          });
      }
    });
  };

  reader.readAsDataURL(file);
}

function finalizeFiles() {
  const dt = new DataTransfer();

  croppedFiles.forEach((f) => dt.items.add(f));

  imageInput.files = dt.files;

  Swal.fire({
    icon: "success",
    title: "Images Ready",
    text: "Images cropped and ready for upload!",
    timer: 2000,
    showConfirmButton: false
  });
}


// REMOVE IMAGE
async function removeImage(variantId, imageUrl, btn) {

  const existingImages = btn
    .closest(".image-grid")
    .querySelectorAll(".image-box");

  if (existingImages.length <= 1) {
    Swal.fire({
      icon: "warning",
      title: "Cannot Remove",
      text: "At least one image is required."
    });
    return;
  }

  const confirm = await Swal.fire({
    title: "Remove Image?",
    text: "This image will be permanently removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, remove it!"
  });

  if (!confirm.isConfirmed) return;

  const res = await fetch("/admin/products/remove-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variantId,
      imageUrl
    })
  });

  const data = await res.json();

  if (data.success) {
    btn.parentElement.remove();

    Swal.fire({
      icon: "success",
      title: "Removed!",
      text: "Image removed successfully.",
      timer: 1500,
      showConfirmButton: false
    });

  } else {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to remove image."
    });
  }
}


// FORM VALIDATION
const form = document.getElementById("editProductForm");
const addVariantBtn = document.getElementById("addVariantBtn");
const variantsContainer = document.getElementById("variantsContainer");

function updateVariantNumbers() {
  document.querySelectorAll(".variant-card").forEach((card, idx) => {
    // Only update headers that are dynamically generated text ("Variant X")
    const h5 = card.querySelector("h5");
    if (h5) h5.innerText = `Variant ${idx + 1}`;
  });
}

let variantIndex = document.querySelectorAll(".variant-card").length;

if (addVariantBtn) {
  addVariantBtn.addEventListener("click", () => {
    
    // Remove the "No variants found" text if it exists
    const noVariantsText = variantsContainer.querySelector(".no-variants");
    if (noVariantsText) noVariantsText.remove();
    
    const index = variantIndex++;
    const visualNumber = document.querySelectorAll(".variant-card").length + 1;
    
    const div = document.createElement("div");
    div.className = "variant-card";
    div.dataset.index = index;
    div.style.marginBottom = "20px";
    div.style.padding = "15px";
    div.style.border = "1px solid #e5e7eb";
    div.style.borderRadius = "8px";
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
        <h5 style="margin:0;">Variant ${visualNumber}</h5>
        <button type="button" class="remove-variant-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;" onclick="this.closest('.variant-card').remove(); updateVariantNumbers();">Remove</button>
      </div>
      
      <label>Color</label>
      <input type="text" name="variants[${index}][color]" required placeholder="E.g. Matte Black" />

      <label>Regular Price</label>
      <input type="number" min="1" class="regularPrice" name="variants[${index}][regularPrice]" required />

      <label>Sales Price</label>
      <input type="number" min="1" class="salesPrice" name="variants[${index}][salesPrice]" required />

      <label>Stock Quantity</label>
      <input type="number" min="0" class="quantity" name="variants[${index}][quantity]" required />

      <label>Images</label>
      <input type="file" name="variants[${index}][images]" multiple accept="image/*" />
    `;
    
    variantsContainer.appendChild(div);
  });
}

form.addEventListener("submit", function (e) {
  
  const variantCards = document.querySelectorAll(".variant-card");
  if (variantCards.length === 0) {
    e.preventDefault();
    Swal.fire({
      icon: "error",
      title: "Missing Variant",
      text: "Please add at least one variant."
    });
    return;
  }
  
  let valid = true;
  
  variantCards.forEach(card => {
    const regularPrice = parseFloat(card.querySelector(".regularPrice")?.value || 0);
    const salesPrice = parseFloat(card.querySelector(".salesPrice")?.value || 0);
    const quantity = parseInt(card.querySelector(".quantity")?.value || 0, 10);

    if (regularPrice <= 0 || salesPrice <= 0 || quantity < 0) {
      if(valid) {
        e.preventDefault();
        valid = false;
        Swal.fire({
          icon: "error",
          title: "Invalid Values",
          text: "Price must be greater than zero and quantity must not be negative."
        });
      }
    }
  });
});