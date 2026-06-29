let variantStates = {};
let variantCount = 0;

const variantsContainer = document.getElementById("variantsContainer");
const addVariantBtn = document.getElementById("addVariantBtn");
const form = document.getElementById("addProductForm");

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

let currentCropper = null;
let currentCropQueue = null; // { files: [], cropped: [], currentIndex: 0, variantIndex: null, previewGrid, input }

function showError(msg) {
  Swal.fire({ icon: "error", title: "Oops!", text: msg });
}
function showSuccess(msg) {
  Swal.fire({ icon: "success", title: "Success", text: msg, timer: 1500, showConfirmButton: false });
}

function updateVariantNumbers() {
  document.querySelectorAll(".variant-card").forEach((card, idx) => {
    const h5 = card.querySelector("h5");
    if (h5) h5.innerText = `Variant ${idx + 1}`;
  });
}

// CREATE VARIANTS
addVariantBtn.addEventListener("click", () => {
  const index = variantCount++;
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
    <input type="text" class="colorInput" name="variants[${index}][color]" required placeholder="E.g. Matte Black" />

    <label>Regular Price</label>
    <input type="number" min="1" class="regularPrice" name="variants[${index}][regularPrice]" required />

    <label>Sales Price</label>
    <input type="number" min="1" class="salesPrice" name="variants[${index}][salesPrice]" required />

    <label>Stock Quantity</label>
    <input type="number" min="0" class="quantity" name="variants[${index}][quantity]" required />

    <label>Images (Min 3)</label>
    <input type="file" class="variant-image-input" data-index="${index}" name="variants[${index}][images]" multiple accept="image/jpeg, image/png, image/webp" required />

    <div class="preview-grid" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;"></div>
  `;
  
  variantsContainer.appendChild(div);
});

// IMAGE SELECTION
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

  if (files.length < 3) {
    showError("Minimum 3 images required for each color");
    e.target.value = "";
    return;
  }

  const card = document.querySelector(`.variant-card[data-index="${index}"]`);
  const previewGrid = card.querySelector(".preview-grid");
  previewGrid.innerHTML = ""; // Clear existing previews

  currentCropQueue = {
    files: files,
    cropped: [],
    currentIndex: 0,
    variantIndex: index,
    previewGrid: previewGrid,
    input: e.target
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

// FINAL FORM SUBMISSION
form.addEventListener("submit", async e => {
  e.preventDefault();

  const variantCards = document.querySelectorAll(".variant-card");
  if (variantCards.length === 0) {
    return showError("Please add at least one variant");
  }

  for (let i = 0; i < variantCards.length; i++) {
    const card = variantCards[i];
    const index = card.dataset.index;
    const state = variantStates[index];
    
    const color = card.querySelector(".colorInput").value;
    const regular = card.querySelector(".regularPrice").value;
    const sales = card.querySelector(".salesPrice").value;
    const qty = card.querySelector(".quantity").value;

    if (!color || !regular || !sales || !qty) { 
      return showError("Please fill all fields for all variants"); 
    }
    if (Number(sales) > Number(regular)) { 
      return showError("Sales price cannot be greater than regular price"); 
    }
    
    const input = card.querySelector(".variant-image-input");
    if (input.files.length < 3) {
      return showError(`Minimum 3 cropped images required for Variant ${i + 1}`);
    }

    if (!state || !state.completed) { 
      return showError(`Please crop all selected images for Variant ${i + 1}`); 
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
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message || "Product added successfully!",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Failed to add product."
      });
    }

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong while saving."
    });
  }
});

// MODAL CONTROLS
function openModal() { document.getElementById("productModal").style.display = "block"; }
function closeModal() { document.getElementById("productModal").style.display = "none"; }

function openStatusModal(productId, page, search, currentState) {
  const actionTxt = currentState === 'Inactive' ? 'Activate' : 'Deactivate';
  const actionColor = currentState === 'Inactive' ? '#10b981' : '#ef4444';
  
  Swal.fire({
    title: `Are you sure?`,
    text: `Do you want to ${actionTxt.toLowerCase()} this product?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: actionColor,
    cancelButtonColor: "#6b7280",
    confirmButtonText: `Yes, ${actionTxt}`
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/admin/products/delete/${productId}?page=${page}&search=${encodeURIComponent(search)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Product ${actionTxt.toLowerCase()}d successfully.`,
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            window.location.href = `/admin/products?page=${page}&search=${encodeURIComponent(search)}`;
          });
        } else {
          Swal.fire("Error", data.message || "Something went wrong", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Something went wrong", "error");
      }
    }
  });
}
