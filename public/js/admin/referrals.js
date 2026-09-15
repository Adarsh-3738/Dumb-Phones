document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const endDate = document.getElementById("endDate");
  const editEndDate = document.getElementById("editEndDate");
  if (endDate) endDate.min = today;
  if (editEndDate) editEndDate.min = today;
});

function openAddModal() {
  document.getElementById("addModal").style.display = "flex";
}

function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}

function openEditModal(id, name, discountValue, startDate, endDate) {
  document.getElementById("editOfferId").value = id;
  document.getElementById("editOfferName").value = name;
  document.getElementById("editDiscountValue").value = discountValue;
  document.getElementById("editStartDate").value = startDate;
  document.getElementById("editEndDate").value = endDate;
  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function submitAdd() {
  const name = document.getElementById("offerName").value;
  const discountValue = document.getElementById("discountValue").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!name || !discountValue || !startDate || !endDate) {
    return Swal.fire("Error", "Please fill all fields", "error");
  }

  if (Number(discountValue) < 1) {
    return Swal.fire("Error", "Discount bonus must be at least ₹1", "error");
  }

  try {
    const res = await fetch("/admin/referrals/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, discountValue, startDate, endDate })
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
  const discountValue = document.getElementById("editDiscountValue").value;
  const startDate = document.getElementById("editStartDate").value;
  const endDate = document.getElementById("editEndDate").value;

  if (!name || !discountValue || !startDate || !endDate) {
    return Swal.fire("Error", "Please fill all fields", "error");
  }

  if (Number(discountValue) < 1) {
    return Swal.fire("Error", "Discount bonus must be at least ₹1", "error");
  }

  try {
    const res = await fetch(`/admin/referrals/edit/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, discountValue, startDate, endDate })
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
    const res = await fetch(`/admin/referrals/toggle-status/${id}`, { method: "PATCH" });
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
    text: "This will permanently delete this referral offer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`/admin/referrals/delete/${id}`, { method: "DELETE" });
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
