
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


 //  DELETE BRAND

async function deleteBrand(id) {

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This brand will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/admin/brand/delete/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (data.success) {

      document.getElementById(`brand-${id}`).remove();

      Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        showConfirmButton: false,
        timer: 1500
      });

    } else {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
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

