let cropper;
let variantStates = {};
let currentCropper = null;
let currentCropQueue = null; // { files: [], cropped: [], currentIndex: 0, variantIndex: null, previewGrid, input, isNewVariant }

// Inject dynamic shared cropper modal
const cropperModalHtml = `
  <div id="cropperModal" class="cropper-modal-overlay">
    <div class="cropper-modal-container">
      <div class="cropper-modal-header">
        <h3 id="cropperModalTitle">Crop Image</h3>
        <span id="closeCropperModal" class="cropper-modal-close">&times;</span>
      </div>
      <div class="cropper-img-wrapper">
        <img id="cropperModalImage" style="max-width: 100%; display: block;" />
      </div>
      <div class="cropper-modal-footer">
        <button type="button" id="cancelCropBtn" class="cropper-btn-cancel">Cancel</button>
        <button type="button" id="saveCropBtn" class="cropper-btn-save">Crop & Next</button>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', cropperModalHtml);

const cropperModal = document.getElementById("cropperModal");
const cropperModalImage = document.getElementById("cropperModalImage");
const cropperModalTitle = document.getElementById("cropperModalTitle");
const closeCropperModal = document.getElementById("closeCropperModal");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const saveCropBtn = document.getElementById("saveCropBtn");

function showError(msg) {
  Swal.fire({ icon: "error", title: "Oops!", text: msg });
}
function showSuccess(msg) {
  Swal.fire({ icon: "success", title: "Success", text: msg, timer: 1500, showConfirmButton: false });
}

// IMAGE SELECTION FOR CROPPING
document.addEventListener("change", e => {
  if (!e.target.classList.contains("variant-image-input")) return;

  const index = e.target.dataset.index;
  const files = Array.from(e.target.files);

  const hasInvalidFormat = files.some(file => 
    !file.type.startsWith("image/") && 
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  );
  
  if (hasInvalidFormat) {
    Swal.fire({
      icon: "error",
      title: "Invalid File Format",
      text: "Only image files (JPEG, PNG, WEBP) are allowed."
    });
    e.target.value = "";
    return;
  }

  const card = e.target.closest(".variant-card");
  const isNewVariant = !card.querySelector('input[type="hidden"][name*="[_id]"]');

  if (isNewVariant && files.length < 3) {
    Swal.fire({
      icon: "warning",
      title: "Minimum Images Required",
      text: "A new variant requires at least 3 images."
    });
    e.target.value = "";
    return;
  }

  const previewGrid = card.querySelector(".preview-grid");
  previewGrid.innerHTML = ""; // Clear existing previews

  currentCropQueue = {
    files: files,
    cropped: [],
    currentIndex: 0,
    variantIndex: index,
    previewGrid: previewGrid,
    input: e.target,
    isNewVariant: isNewVariant
  };

  openCropperForQueue();
});

// LOAD IMAGE
function openCropperForQueue() {
  if (!currentCropQueue || currentCropQueue.currentIndex >= currentCropQueue.files.length) {
    finalizeCropping();
    return;
  }

  const file = currentCropQueue.files[currentCropQueue.currentIndex];
  cropperModalTitle.innerText = `Crop Image ${currentCropQueue.currentIndex + 1} of ${currentCropQueue.files.length}`;

  const reader = new FileReader();
  reader.onload = () => {
    cropperModalImage.src = reader.result;
    cropperModal.style.display = "flex";

    if (currentCropper) currentCropper.destroy();

    currentCropper = new Cropper(cropperModalImage, {
      aspectRatio: 1,
      viewMode: 2,
      autoCropArea: 1,
      background: false
    });
  };
  reader.readAsDataURL(file);
}

// CROP & SAVE ACTION
saveCropBtn.addEventListener("click", () => {
  if (!currentCropper || !currentCropQueue) return;

  currentCropper.getCroppedCanvas({ width: 600, height: 600 }).toBlob(blob => {
    const file = new File(
      [blob],
      currentCropQueue.files[currentCropQueue.currentIndex].name,
      { type: "image/jpeg" }
    );

    currentCropQueue.cropped.push(file);

    // Render preview item
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "70px";
    img.style.height = "70px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "6px";
    img.style.border = "1px solid #cbd5e1";
    currentCropQueue.previewGrid.appendChild(img);

    currentCropQueue.currentIndex++;
    openCropperForQueue();
  }, "image/jpeg");
});

// FINALIZE FILES
function finalizeCropping() {
  if (!currentCropQueue) return;

  const dt = new DataTransfer();
  currentCropQueue.cropped.forEach(file => dt.items.add(file));
  currentCropQueue.input.files = dt.files;

  // Mark state as completed
  if (!variantStates[currentCropQueue.variantIndex]) {
    variantStates[currentCropQueue.variantIndex] = {};
  }
  variantStates[currentCropQueue.variantIndex].completed = true;

  cropperModal.style.display = "none";
  if (currentCropper) {
    currentCropper.destroy();
    currentCropper = null;
  }

  showSuccess(`Successfully cropped all images for Variant ${Number(currentCropQueue.variantIndex) + 1}`);
  currentCropQueue = null;
}

// CANCEL CROPPING
function cancelCropping() {
  if (currentCropper) {
    currentCropper.destroy();
    currentCropper = null;
  }
  cropperModal.style.display = "none";
  if (currentCropQueue) {
    currentCropQueue.input.value = ""; // Reset file selection
    currentCropQueue.previewGrid.innerHTML = "";
    if (variantStates[currentCropQueue.variantIndex]) {
      variantStates[currentCropQueue.variantIndex].completed = false;
    }
    currentCropQueue = null;
  }
}

cancelCropBtn.addEventListener("click", cancelCropping);
closeCropperModal.addEventListener("click", cancelCropping);


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

// FORM DYNAMICS AND SUBMISSION
const form = document.getElementById("editProductForm");
const addVariantBtn = document.getElementById("addVariantBtn");
const variantsContainer = document.getElementById("variantsContainer");

function updateVariantNumbers() {
  document.querySelectorAll(".variant-card").forEach((card, idx) => {
    const h5 = card.querySelector("h5");
    if (h5) h5.innerText = `Variant ${idx + 1}`;
  });
}

let variantIndex = document.querySelectorAll(".variant-card").length;

if (addVariantBtn) {
  addVariantBtn.addEventListener("click", () => {
    const noVariantsText = variantsContainer.querySelector(".no-variants");
    if (noVariantsText) noVariantsText.remove();
    
    const index = variantIndex++;
    const visualNumber = document.querySelectorAll(".variant-card").length + 1;
    
    const div = document.createElement("div");
    div.className = "variant-card";
    div.dataset.index = index;
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
        <h5 style="margin:0;">Variant ${visualNumber}</h5>
        <button type="button" class="remove-variant-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;" onclick="this.closest('.variant-card').remove(); delete variantStates['${index}']; updateVariantNumbers();">Remove</button>
      </div>
      
      <label>Color</label>
      <input type="text" name="variants[${index}][color]" required placeholder="E.g. Matte Black" />

      <label>Regular Price</label>
      <input type="number" min="1" class="regularPrice" name="variants[${index}][regularPrice]" required />

      <label>Sales Price</label>
      <input type="number" min="1" class="salesPrice" name="variants[${index}][salesPrice]" required />

      <label>Quantity</label>
      <input type="number" min="0" class="quantity" name="variants[${index}][quantity]" required />

      <label>Images (Min 3)</label>
      <input type="file" class="variant-image-input" data-index="${index}" name="variants[${index}][images]" multiple accept="image/jpeg, image/png, image/webp" required />
      <div class="preview-grid" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;"></div>
    `;
    
    variantsContainer.appendChild(div);
  });
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  
  const variantCards = document.querySelectorAll(".variant-card");
  if (variantCards.length === 0) {
    Swal.fire({
      icon: "error",
      title: "Missing Variant",
      text: "Please add at least one variant."
    });
    return;
  }
  
  for (let i = 0; i < variantCards.length; i++) {
    const card = variantCards[i];
    const index = card.dataset.index;
    
    const color = card.querySelector("input[name*='[color]']").value;
    const regularPrice = parseFloat(card.querySelector(".regularPrice")?.value || 0);
    const salesPrice = parseFloat(card.querySelector(".salesPrice")?.value || 0);
    const quantity = parseInt(card.querySelector("input[name*='[quantity]']")?.value || 0, 10);

    if (!color || regularPrice <= 0 || salesPrice <= 0 || quantity < 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Values",
        text: "Please fill all variant details correctly."
      });
      return;
    }

    if (salesPrice > regularPrice) {
      Swal.fire({
        icon: "error",
        title: "Invalid Prices",
        text: "Sales price cannot be greater than regular price."
      });
      return;
    }

    const isNewVariant = !card.querySelector('input[type="hidden"][name*="[_id]"]');
    const fileInput = card.querySelector(".variant-image-input");
    
    if (isNewVariant && (!fileInput || fileInput.files.length < 3)) {
      Swal.fire({
        icon: "error",
        title: "Images Required",
        text: `New variants require at least 3 cropped images. Check Variant ${i + 1}.`
      });
      return;
    }

    const state = variantStates[index];
    if (fileInput && fileInput.files.length > 0 && (!state || !state.completed)) {
      Swal.fire({
        icon: "error",
        title: "Crop Pending",
        text: `Please crop all selected images for Variant ${i + 1}.`
      });
      return;
    }
  }

  Swal.fire({ 
    title: "Saving Product...", 
    text: "Please wait", 
    showConfirmButton: false, 
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST", // patched dynamically via query param ?_method=PATCH
      body: formData
    });
    
    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message || "Product updated successfully!",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "/admin/products";
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Failed to update product."
      });
    }

  } catch(error) {
     Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong while updating."
    });
  }
});