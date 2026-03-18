

  const modal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");

  function openDeleteModal(addressId) {
    Swal.fire({
      title: 'Delete Address',
      text: "Are you sure you want to delete this address?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        // Create a dynamic form to submit the DELETE request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/address/delete/${addressId}?_method=DELETE`;
        document.body.appendChild(form);
        form.submit();
      }
    });
  }

