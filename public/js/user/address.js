

  const modal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");

  function openDeleteModal(addressId) {
    
    deleteForm.action = `/address/delete/${addressId}?_method=DELETE`;
    modal.style.display = "flex";
  }

  function closeDeleteModal() {
    modal.style.display = "none";
  }

