function updateActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && (currentPath === href || (href !== "/admin/dashboard" && currentPath.startsWith(href)))) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function bindInstantNavClicks() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  updateActiveNavLink();
  bindInstantNavClicks();
  if (typeof initDashboardCharts === 'function') {
    initDashboardCharts();
  }
});

document.addEventListener("htmx:configRequest", () => {
  const bar = document.getElementById("admin-top-bar");
  if (bar) {
    bar.style.opacity = "1";
    bar.style.width = "65%";
  }
});

document.addEventListener("htmx:afterSettle", () => {
  const bar = document.getElementById("admin-top-bar");
  if (bar) {
    bar.style.width = "100%";
    setTimeout(() => {
      bar.style.opacity = "0";
      bar.style.width = "0%";
    }, 200);
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  updateActiveNavLink();
  bindInstantNavClicks();
  if (typeof initDashboardCharts === 'function') {
    initDashboardCharts();
  }
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
