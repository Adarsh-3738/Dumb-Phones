document.addEventListener("DOMContentLoaded", () => {
  // Check for success query params
  const urlParams = new URLSearchParams(window.location.search);
  const successParam = urlParams.get('success');

  if (successParam === 'added') {
    Swal.fire({
      icon: 'success',
      title: 'Address Added!',
      text: 'Your new address was successfully saved.',
      confirmButtonColor: '#2563eb',
      timer: 3000
    });
    window.history.replaceState(null, '', window.location.pathname);
  } else if (successParam === 'updated') {
    Swal.fire({
      icon: 'success',
      title: 'Address Updated!',
      text: 'Your address was successfully updated.',
      confirmButtonColor: '#2563eb',
      timer: 3000
    });
    window.history.replaceState(null, '', window.location.pathname);
  } else if (successParam === 'deleted') {
    Swal.fire({
      icon: 'success',
      title: 'Address Deleted!',
      text: 'Your address was successfully removed.',
      confirmButtonColor: '#2563eb',
      timer: 3000
    });
    window.history.replaceState(null, '', window.location.pathname);
  }
});

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
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/address/delete/${addressId}?_method=DELETE`;
      document.body.appendChild(form);
      form.submit();
    }
  });
}
