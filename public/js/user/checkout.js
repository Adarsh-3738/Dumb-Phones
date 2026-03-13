  function addNewAddress() {
    window.location.href = "/address/add";
  }

  function editAddress(id) {
    window.location.href = `/address/edit/${id}`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const addressForm = document.getElementById("addressForm");
    
    if (addressForm) {
      addressForm.addEventListener("submit", (e) => {
        const selectedAddress = document.querySelector('input[name="addressId"]:checked');
        
        if (!selectedAddress) {
          e.preventDefault(); // Stop standard form submission
          
          Swal.fire({
            icon: 'warning',
            title: 'Action Required',
            text: 'Please select a delivery address to place your order. If you haven\'t added one, please add a new address.',
            confirmButtonColor: '#1d4ed8'
          });
        }
      });
    }
  });
