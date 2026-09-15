function toggleCustomDates() {
  const isCustom = document.getElementById("rangeSelect").value === "custom";
  document.querySelectorAll(".custom-dates").forEach(el => {
    el.style.display = isCustom ? "flex" : "none";
  });
}

function validateCustomDates(event) {
  const rangeSelect = document.getElementById("rangeSelect").value;
  if (rangeSelect === "custom") {
    const startDateNode = document.querySelector('input[name="startDate"]');
    const endDateNode = document.querySelector('input[name="endDate"]');
    
    if (!startDateNode.value || !endDateNode.value) {
      event.preventDefault();
      Swal.fire("Validation Error", "Please select both Start Date and End Date.", "warning");
      return false;
    }
    
    const start = new Date(startDateNode.value);
    const end = new Date(endDateNode.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (start > end) {
      event.preventDefault();
      Swal.fire("Validation Error", "Start Date cannot be after End Date.", "warning");
      return false;
    }
    
    if (end > today) {
      event.preventDefault();
      Swal.fire("Validation Error", "End Date cannot be in the future.", "warning");
      return false;
    }
  }
  return true;
}
