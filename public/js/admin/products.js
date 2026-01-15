
  let cropper;
  let selectedFiles = [];
  let croppedFiles = [];
  let currentIndex = 0;

  const imageInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const cropNextBtn = document.getElementById("cropNextBtn");
  const previewGrid = document.getElementById("croppedPreviewGrid");

  function addPreviewThumb(file) {
    const div = document.createElement("div");
    div.className = "preview-thumb";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.innerText = "×";
    btn.onclick = () => {
      const index = Array.from(previewGrid.children).indexOf(div);
      croppedFiles.splice(index, 1);
      div.remove();
      updateFileInput();
    };

    div.appendChild(img);
    div.appendChild(btn);
    previewGrid.appendChild(div);

    updateFileInput();
  }

  imageInput.addEventListener("change", (e) => {
    selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length < 3) {
      alert("Minimum 3 images required");
      imageInput.value = "";
      return;
    }

    currentIndex = 0;
    croppedFiles = [];
    loadImage(selectedFiles[currentIndex]);
  });

  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = reader.result;
      previewImage.style.display = "block";

      if (cropper) cropper.destroy();

      cropper = new Cropper(previewImage, {
        aspectRatio: 1,
        viewMode: 2,
        autoCropArea: 1,
      });
    };
    reader.readAsDataURL(file);
  }

  cropNextBtn.addEventListener("click", () => {
    if (!cropper) return;

    cropper.getCroppedCanvas({ width: 600, height: 600 }).toBlob((blob) => {
      const file = new File([blob], selectedFiles[currentIndex].name, { type: "image/jpeg" });
      croppedFiles.push(file);
      addPreviewThumb(file);
      currentIndex++;

      cropper.destroy();

      if (currentIndex < selectedFiles.length) {
        loadImage(selectedFiles[currentIndex]);
      } else {
        alert("All images cropped successfully");
      }
    });
  });

  function updateFileInput() {
    const dataTransfer = new DataTransfer();
    croppedFiles.forEach(file => dataTransfer.items.add(file));
    imageInput.files = dataTransfer.files;
  }

  function openModal() {
    document.getElementById("productModal").style.display = "block";
  }

  function closeModal() {
    document.getElementById("productModal").style.display = "none";
    if (cropper) cropper.destroy();
    previewImage.style.display = "none";
  }


 //active deactive modal

let selectedProductId = null;

function openStatusModal(productId, action) {
  selectedProductId = productId;

  const title = document.getElementById("statusTitle");
  const message = document.getElementById("statusMessage");
  const confirmBtn = document.getElementById("confirmStatusBtn");

  if (action === "deactivate") {
    title.innerText = "Deactivate Product";
    message.innerText = "This product will be hidden from users.";
  } else {
    title.innerText = "Activate Product";
    message.innerText = "This product will be visible to users.";
  }

  confirmBtn.onclick = () => {
    window.location.href = `/admin/products/delete/${productId}`;
  };

  document.getElementById("statusModal").style.display = "block";
}

function closeStatusModal() {
  document.getElementById("statusModal").style.display = "none";
  selectedProductId = null;
}




