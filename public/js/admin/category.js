
  let editId = null;
  let deleteId = null;

  /* ADD CATEGORY */
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
    .then((res) => res.json())
    .then((data) => {
      if (data.success) location.reload();
      else alert(data.msg);
    });
}


  /* EDIT CATEGORY */
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: editId, name, status })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) location.reload();
      else alert(data.msg);
    });
}


  /* DELETE CATEGORY */
  function openDeleteModal(id) {
    deleteId = id;
    document.getElementById("deleteModal").style.display = "flex";
  }
  function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
  }
  function submitDelete() {
  fetch("/admin/category/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: deleteId })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) location.reload();
      else alert("Delete failed");
    });
}


