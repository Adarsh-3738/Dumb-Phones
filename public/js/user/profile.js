document.addEventListener('DOMContentLoaded', () => {
  //  for success params
  const urlParams = new URLSearchParams(window.location.search);
  const emailChanged = urlParams.get('emailChanged');
  const successParam = urlParams.get('success');

  if (emailChanged === 'true') {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Your email address has been updated successfully.',
      confirmButtonColor: '#1d4ed8'
    }).then(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  } else if (successParam === 'profile_updated') {
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated!',
      text: 'Your personal details were saved successfully.',
      confirmButtonColor: '#2563eb',
      timer: 3000
    });
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});
  
