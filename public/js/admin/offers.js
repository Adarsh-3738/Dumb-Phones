// Set minimum date to today for date inputs
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("endDate").min = today;
  document.getElementById("editEndDate").min = today;
});

function openAddModal() {
  document.getElementById("addModal").style.display = "flex";
  toggleTargetDropdown();
}

function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}

function toggleEditTargetDropdown(selectedTargetId = "") {
  const type = document.getElementById("editOfferType").value;
  const targetSelect = document.getElementById("editOfferTarget");
  
  targetSelect.innerHTML = "";
  
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
  }
}

function toggleTargetDropdown() {
  const type = document.getElementById("offerType").value;
  const targetSelect = document.getElementById("offerTarget");
  
  targetSelect.innerHTML = "";
  
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
  }
}

function openEditModal(id, name, type, targetId, discountValue, endDate) {
  document.getElementById("editOfferId").value = id;
  document.getElementById("editOfferName").value = name;
  document.getElementById("editOfferType").value = type;
  document.getElementById("editDiscountValue").value = discountValue;
  document.getElementById("editEndDate").value = endDate;

  toggleEditTargetDropdown(targetId);
  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function submitAdd() {
  const name = document.getElementById("offerName").value;
  const type = document.getElementById("offerType").value;
  const target = document.getElementById("offerTarget").value;
  const discountValue = document.getElementById("discountValue").value;
  const endDate = document.getElementById("endDate").value;

  if (!name || !discountValue || !endDate) {
    return Swal.fire("Error", "Please fill all fields", "error");
  }

  if (discountValue < 1 || discountValue > 99) {
    return Swal.fire("Error", "Discount must be between 1 and 99", "error");
  }

  try {
    const res = await fetch("/admin/offers/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, target, discountValue, endDate })
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
  const discountValue = document.getElementById("editDiscountValue").value;
  const endDate = document.getElementById("editEndDate").value;

  if (!name || !discountValue || !endDate) {
    return Swal.fire("Error", "Please fill all fields", "error");
  }

  if (discountValue < 1 || discountValue > 99) {
    return Swal.fire("Error", "Discount must be between 1 and 99", "error");
  }

  try {
    const res = await fetch(`/admin/offers/edit/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, target, discountValue, endDate })
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
