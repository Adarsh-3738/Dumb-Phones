let variantStates = {};
let variantCount = 0;

const variantsContainer = document.getElementById("variantsContainer");
const addVariantBtn = document.getElementById("addVariantBtn");

const form = document.getElementById("addProductForm");
// SWEET ALERT 
function showError(msg) {
  Swal.fire({ icon: "error", title: "Oops!", text: msg });
}
function showSuccess(msg) {
  Swal.fire({ icon: "success", title: "Success", text: msg });
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
  div.style.marginBottom = "20px";
  div.style.padding = "15px";
  div.style.border = "1px solid #e5e7eb";
  div.style.borderRadius = "8px";
  
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

    <img class="crop-preview" style="display:none;max-width:100%;margin-top:10px;" />

    <button type="button" class="crop-next-btn btn-outline" style="margin-top:10px;">Crop & Next</button>

    <div class="preview-grid" style="display:flex;gap:8px;margin-top:10px;"></div>
  `;
  
  variantsContainer.appendChild(div);
});

// IMAGE SELECTION 
document.addEventListener("change", e => {
  if (!e.target.classList.contains("variant-image-input")) return;

  const index = e.target.dataset.index;
  const files = Array.from(e.target.files);

  // Validate format limits to images only
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

  variantStates[index] = {
    selectedFiles: files,
    croppedFiles: [],
    currentIndex: 0,
    cropper: null,
    previewImg: card.querySelector(".crop-preview"),
    input: e.target,
    previewGrid: card.querySelector(".preview-grid"),
    completed: false
  };

  loadVariantImage(index);
});

// LOAD IMAGE
function loadVariantImage(index) {
  const state = variantStates[index];
  const file = state.selectedFiles[state.currentIndex];

  const reader = new FileReader();
  reader.onload = () => {
    state.previewImg.src = reader.result;
    state.previewImg.style.display = "block";

    if (state.cropper) state.cropper.destroy();

    state.cropper = new Cropper(state.previewImg, {
      aspectRatio: 1,
      viewMode: 2,
      autoCropArea: 1
    });
  };
  reader.readAsDataURL(file);
}

// CROP & NEXT 
document.addEventListener("click", e => {
  if (!e.target.classList.contains("crop-next-btn")) return;

  const card = e.target.closest(".variant-card");
  const index = card.dataset.index;
  const state = variantStates[index];

  if (!state || !state.cropper) return showError("Please select images first");

  state.cropper.getCroppedCanvas({ width: 600, height: 600 })
    .toBlob(blob => {
      const file = new File(
        [blob],
        state.selectedFiles[state.currentIndex].name,
        { type: "image/jpeg" }
      );

      state.croppedFiles.push(file);
      addVariantPreview(state, file);

      state.currentIndex++;
      state.cropper.destroy();

      if (state.currentIndex < state.selectedFiles.length) {
        loadVariantImage(index);
      } else {
        updateVariantInput(state);
        state.completed = true;
        showSuccess(`All images cropped for ${card.querySelector("h5").innerText}`);
      }
    });
});

// PREVIEW 
function addVariantPreview(state, file) {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "70px";
  img.style.borderRadius = "6px";
  state.previewGrid.appendChild(img);
}

//  UPDATE INPUT 
function updateVariantInput(state) {
  const dt = new DataTransfer();
  state.croppedFiles.forEach(file => dt.items.add(file));
  state.input.files = dt.files; 
}

// FINAL FORM VALIDATION 
form.addEventListener("submit", async e => {
  e.preventDefault();

  if (Object.keys(variantStates).length === 0 && !document.querySelector('.variant-card')) { 
    return showError("Please add at least one variant"); 
  }

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
    
    // If files are selected, but crop sequence isn't complete
    if (state && !state.completed && state.selectedFiles && state.selectedFiles.length > 0) { 
      return showError(`Please crop all images for Variant ${Number(index) + 1}`); 
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

// MODAL 
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
