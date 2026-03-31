// Set minimum date to today for date inputs
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("endDate").min = today;
  document.getElementById("editEndDate").min = today;
});

function openAddModal() {
  document.getElementById("addModal").style.display = "flex";
  toggleTargetDropdown();
  toggleDiscountType(false);
}

function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}

function toggleEditTargetDropdown(selectedTargetId = "") {
  const type = document.getElementById("editOfferType").value;
  const targetSelect = document.getElementById("editOfferTarget");
  
  targetSelect.innerHTML = "";
  document.getElementById("editDiscountType").disabled = false;
  
  if (type === "Product") {
    products.forEach(p => {
      if (!p.isBlocked) {
        const option = document.createElement("option");
        option.value = p._id;
        option.textContent = p.productName;
        if (selectedTargetId === p._id.toString()) option.selected = true;
        targetSelect.appendChild(option);
      }
    });
  } else if (type === "Category") {
    categories.forEach(c => {
      if (!c.isDeleted) {
        const option = document.createElement("option");
        option.value = c._id;
        option.textContent = c.name;
        if (selectedTargetId === c._id.toString()) option.selected = true;
        targetSelect.appendChild(option);
      }
    });
  } else if (type === "Referral") {
    targetSelect.disabled = true;
    targetSelect.innerHTML = "<option value=''>Global (No Target Issued)</option>";
    document.getElementById("editDiscountType").value = "Fixed Amount";
    document.getElementById("editDiscountType").disabled = true;
    toggleDiscountType(true);
  }
}

function toggleTargetDropdown() {
  const type = document.getElementById("offerType").value;
  const targetSelect = document.getElementById("offerTarget");
  
  targetSelect.innerHTML = "";
  document.getElementById("discountType").disabled = false;
  
  if (type === "Product") {
    products.forEach(p => {
      if (!p.isBlocked) {
        const option = document.createElement("option");
        option.value = p._id;
        option.textContent = p.productName;
        targetSelect.appendChild(option);
      }
    });
  } else if (type === "Category") {
    categories.forEach(c => {
      if (!c.isDeleted) {
        const option = document.createElement("option");
        option.value = c._id;
        option.textContent = c.name;
        targetSelect.appendChild(option);
      }
    });
  } else if (type === "Referral") {
    targetSelect.disabled = true;
    targetSelect.innerHTML = "<option value=''>Global (No Target Issued)</option>";
    document.getElementById("discountType").value = "Fixed Amount";
    document.getElementById("discountType").disabled = true;
    toggleDiscountType(false);
  }
}

function toggleDiscountType(isEdit) {
  if (isEdit) {
    const type = document.getElementById("editDiscountType").value;
    const container = document.getElementById("editMaxDiscountContainer");
    if (type === "Percentage") {
      container.style.display = "block";
    } else {
      container.style.display = "none";
      document.getElementById("editMaxDiscountAmount").value = "";
    }
  } else {
    const type = document.getElementById("discountType").value;
    const container = document.getElementById("maxDiscountContainer");
    if (type === "Percentage") {
      container.style.display = "block";
    } else {
      container.style.display = "none";
      document.getElementById("maxDiscountAmount").value = "";
    }
  }
}

function openEditModal(id, name, type, targetId, discountType, discountValue, maxDiscountAmount, startDate, endDate) {
  document.getElementById("editOfferId").value = id;
  document.getElementById("editOfferName").value = name;
  document.getElementById("editOfferType").value = type;
  document.getElementById("editDiscountType").value = discountType;
  document.getElementById("editDiscountValue").value = discountValue;
  document.getElementById("editMaxDiscountAmount").value = maxDiscountAmount;
  document.getElementById("editStartDate").value = startDate;
  document.getElementById("editEndDate").value = endDate;

  toggleEditTargetDropdown(targetId);
  toggleDiscountType(true);
  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function submitAdd() {
  const name = document.getElementById("offerName").value;
  const type = document.getElementById("offerType").value;
  const target = document.getElementById("offerTarget").value;
  const discountType = document.getElementById("discountType").value;
  const discountValue = document.getElementById("discountValue").value;
  const maxDiscountAmount = document.getElementById("maxDiscountAmount").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!name || !discountValue || !startDate || !endDate) {
    return Swal.fire("Error", "Please fill all fields", "error");
  }

  if (discountValue < 1) {
    return Swal.fire("Error", "Discount must be at least 1", "error");
  }
  
  if (discountType === "Percentage" && maxDiscountAmount && maxDiscountAmount < 1) {
    return Swal.fire("Error", "Maximum discount limit must be at least 1", "error");
  }

  try {
    const res = await fetch("/admin/offers/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, discountType, target, discountValue, maxDiscountAmount: maxDiscountAmount || null, startDate, endDate })
    });

    const data = await res.json();
    if (data.success) {
      Swal.fire("Success", data.message, "success").then(() => location.reload());
    } else {
      Swal.fire("Error", data.message, "error");
    }
  } catch (error) {
    Swal.fire("Error", "Something went wrong", "error");
  }
}

async function submitEdit() {
  const id = document.getElementById("editOfferId").value;
  const name = document.getElementById("editOfferName").value;
  const type = document.getElementById("editOfferType").value;
  const target = document.getElementById("editOfferTarget").value;
  const discountType = document.getElementById("editDiscountType").value;
  const discountValue = document.getElementById("editDiscountValue").value;
  const maxDiscountAmount = document.getElementById("editMaxDiscountAmount").value;
  const startDate = document.getElementById("editStartDate").value;
  const endDate = document.getElementById("editEndDate").value;

  if (!name || !discountValue || !startDate || !endDate) {
    return Swal.fire("Error", "Please fill all fields", "error");
  }

  if (discountValue < 1) {
    return Swal.fire("Error", "Discount must be at least 1", "error");
  }

  if (discountType === "Percentage" && maxDiscountAmount && maxDiscountAmount < 1) {
    return Swal.fire("Error", "Maximum discount limit must be at least 1", "error");
  }

  try {
    const res = await fetch(`/admin/offers/edit/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, target, discountType, discountValue, maxDiscountAmount: maxDiscountAmount || null, startDate, endDate })
    });

    const data = await res.json();
    if (data.success) {
      Swal.fire("Success", data.message, "success").then(() => location.reload());
    } else {
      Swal.fire("Error", data.message, "error");
    }
  } catch (error) {
    Swal.fire("Error", "Something went wrong", "error");
  }
}

async function toggleStatus(id) {
  try {
    const res = await fetch(`/admin/offers/toggle-status/${id}`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      location.reload();
    } else {
      Swal.fire("Error", data.message, "error");
    }
  } catch (error) {
    Swal.fire("Error", "Failed to toggle status", "error");
  }
}

async function deleteOffer(id) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the offer and restore original prices.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`/admin/offers/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Deleted!", data.message, "success").then(() => location.reload());
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  }
}

async function syncAllOffers() {
  try {
    const res = await fetch("/admin/offers/sync", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      Swal.fire("Synced!", data.message, "success").then(() => location.reload());
    } else {
      Swal.fire("Error", data.message, "error");
    }
  } catch (error) {
    Swal.fire("Error", "Failed to sync offers", "error");
  }
}
