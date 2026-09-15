document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Highlight current active navigation link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && currentPath.startsWith(href)) {
      link.classList.add("active");
    }
  });
});

// Logout SweetAlert confirmation
function openLogoutModal() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to end your session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, Logout"
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/admin/logout";
      }
    });
  } else {
    if (confirm("Are you sure you want to log out?")) {
      window.location.href = "/admin/logout";
    }
  }
}
