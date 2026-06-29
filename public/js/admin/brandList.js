
let editId = null;


 //  ADD BRAND

function openAddModal() {
  document.getElementById("addModal").style.display = "flex";
}

function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}

async function submitAdd() {
  const name = addName.value.trim();
  const country = addCountry.value.trim();
  const founded = addFounded.value.trim();

  if (!name || !country || !founded) {
    return Swal.fire({
      icon: "warning",
      title: "All fields are required"
    });
  }

  try {
    const res = await fetch("/admin/brand/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country, founded })
    });

    const data = await res.json();

    if (data.success) {
      closeAddModal();

      Swal.fire({
        icon: "success",
        title: "Brand Added Successfully",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        location.reload();
      });

    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: data.message
      });
    }

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Server Error"
    });
  }
}



 //  EDIT BRAND

function openEditModal(id, name, country, founded) {
  editId = id;
  editName.value = name;
  editCountry.value = country;
  editFounded.value = founded;

  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function submitEdit() {
  const name = editName.value.trim();
  const country = editCountry.value.trim();
  const founded = editFounded.value.trim();

  if (!name || !country || !founded) {
    return Swal.fire({
      icon: "warning",
      title: "All fields are required"
    });
  }

  try {
    const res = await fetch(`/admin/brand/edit/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country, founded })
    });

    const data = await res.json();

    if (data.success) {
      closeEditModal();

      Swal.fire({
        icon: "success",
        title: "Brand Updated Successfully",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        location.reload();
      });

    } else {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: data.message
      });
    }

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Server Error"
    });
  }
}


 //  BLOCK / UNBLOCK BRAND

async function toggleBrandStatus(id, isBlocked) {
  const nextAction = isBlocked ? "unblock" : "block";

  const result = await Swal.fire({
    title: "Are you sure?",
    text: isBlocked
      ? "Products from this brand will be visible again."
      : "Products from this brand will no longer be available to customers.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isBlocked ? "#16a34a" : "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: `Yes, ${nextAction} it!`
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/admin/brand/status/${id}`, {
      method: "PATCH"
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: data.message || "Brand status updated",
        showConfirmButton: false,
        timer: 1500
      }).then(() => location.reload());

    } else {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: data.message
      });
    }

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Server Error"
    });
  }
}
