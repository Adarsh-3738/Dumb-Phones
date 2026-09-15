document.addEventListener("DOMContentLoaded", () => {
  const expireDate = document.getElementById('expireDate');
  const editExpireDate = document.getElementById('editExpireDate');
  const startDate = document.getElementById('startDate');
  const editStartDate = document.getElementById('editStartDate');

  const today = new Date().toISOString().split("T")[0];
  if (expireDate) expireDate.min = today;
  if (editExpireDate) editExpireDate.min = today;
  if (startDate) startDate.min = today;
  if (editStartDate) editStartDate.min = today;
});

function toggleMaxDiscount(type, containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.style.display = type === 'Percentage' ? 'block' : 'none';
  }
}

function openEditModal(id, name, offerPrice, minPrice, startOn, expireOn, discountType, maxDiscountAmount) {
  document.getElementById('editCouponId').value = id;
  document.getElementById('editCouponName').value = name;
  document.getElementById('editOfferPrice').value = offerPrice;
  document.getElementById('editMinPrice').value = minPrice;
  document.getElementById('editStartDate').value = startOn;
  document.getElementById('editExpireDate').value = expireOn;
  document.getElementById('editDiscountType').value = discountType;
  document.getElementById('editMaxDiscountAmount').value = maxDiscountAmount;
  
  toggleMaxDiscount(discountType, 'editMaxDiscountContainer');
  document.getElementById('editModal').style.display = 'flex';
}

async function submitCoupon() {
  const payload = {
    name: document.getElementById('couponName').value,
    discountType: document.getElementById('discountType').value,
    offerPrice: document.getElementById('offerPrice').value,
    maxDiscountAmount: document.getElementById('maxDiscountAmount').value,
    minimumPrice: document.getElementById('minPrice').value,
    startDate: document.getElementById('startDate').value,
    expireOn: document.getElementById('expireDate').value
  };

  if (!payload.name || !payload.offerPrice || !payload.minimumPrice || !payload.startDate || !payload.expireOn) {
    return Swal.fire("Error", "All fields are required", "error");
  }

  try {
    const res = await fetch('/admin/coupons/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    
    if (result.success) {
      Swal.fire("Success", result.message, "success").then(() => location.reload());
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (e) {
    Swal.fire("Error", "Something went wrong", "error");
  }
}

async function submitEdit() {
  const id = document.getElementById('editCouponId').value;
  const payload = {
    name: document.getElementById('editCouponName').value,
    discountType: document.getElementById('editDiscountType').value,
    offerPrice: document.getElementById('editOfferPrice').value,
    maxDiscountAmount: document.getElementById('editMaxDiscountAmount').value,
    minimumPrice: document.getElementById('editMinPrice').value,
    startDate: document.getElementById('editStartDate').value,
    expireOn: document.getElementById('editExpireDate').value
  };

  if (!payload.name || !payload.offerPrice || !payload.minimumPrice || !payload.startDate || !payload.expireOn) {
    return Swal.fire("Error", "All fields are required", "error");
  }

  try {
    const res = await fetch(`/admin/coupons/edit/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    
    if (result.success) {
      Swal.fire("Success", result.message, "success").then(() => location.reload());
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (e) {
    Swal.fire("Error", "Something went wrong", "error");
  }
}

async function deleteCoupon(id) {
  if (await Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true }).then(r => r.isConfirmed)) {
    const res = await fetch('/admin/coupons/delete/' + id, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) location.reload();
  }
}
