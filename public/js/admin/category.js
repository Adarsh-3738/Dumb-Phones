
  let editId = null;
  let deleteId = null;

  // ADD CATEGORY
  function openAddModal() {
    document.getElementById("addModal").style.display = "flex";
  }
  function closeAddModal() {
    document.getElementById("addModal").style.display = "none";
  }
  function submitAdd() {
  const name = document.getElementById("addName").value;
  const status = document.getElementById("addStatus").value;

  fetch("/admin/category/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, status })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Category Added",
          showConfirmButton: false,
          timer: 1200
        }).then(() => location.reload());
      } else {
        Swal.fire("Error", data.msg, "error");
      }
    });
}

  // EDIT CATEGORY
  function openEditModal(id, name, status) {
    editId = id;
    document.getElementById("editName").value = name;
    document.getElementById("editStatus").value = status;
    document.getElementById("editModal").style.display = "flex";
  }
  function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
  }
  function submitEdit() {
  const name = document.getElementById("editName").value;
  const status = document.getElementById("editStatus").value;

  fetch("/admin/category/edit", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: editId, name, status })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Category Updated",
          showConfirmButton: false,
          timer: 1200
        }).then(() => location.reload());
      } else {
        Swal.fire("Error", data.msg, "error");
      }
    });
}


  // DELETE CATEGORY 
  function openDeleteModal(id) {
    deleteId = id;
    document.getElementById("deleteModal").style.display = "flex";
  }
  function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
  }
  function submitDelete() {
  Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e74c3c",
    confirmButtonText: "Yes, delete it!"
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/admin/category/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            Swal.fire("Deleted!", "Category removed.", "success")
              .then(() => location.reload());
          } else {
            Swal.fire("Error", "Delete failed", "error");
          }
        });
    }
  });
}


