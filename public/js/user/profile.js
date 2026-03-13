document.addEventListener('DOMContentLoaded', () => {
    // Check for success params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('emailChanged') === 'true') {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Your email address has been updated successfully.',
        confirmButtonColor: '#1d4ed8'
      }).then(() => {
        // Clear param from URL to prevent showing alert again on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  });
  
