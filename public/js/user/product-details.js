
  const decreaseBtn = document.getElementById('decreaseQty');
  const increaseBtn = document.getElementById('increaseQty');
  const qtyInput = document.getElementById('qtyInput');
  const maxQty = parseInt(qtyInput.max);

  decreaseBtn.addEventListener('click', () => {
    let current = parseInt(qtyInput.value);
    if (current > 1) qtyInput.value = current - 1;
  });

  increaseBtn.addEventListener('click', () => {
    let current = parseInt(qtyInput.value);
    if (current < maxQty) qtyInput.value = current + 1;
  });




    //for image zoom
  const zoomContainer = document.querySelector(".image-zoom-container");
  const mainImage = document.getElementById("mainImage");

  zoomContainer.addEventListener("mousemove", (e) => {
    const rect = zoomContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    mainImage.style.transformOrigin = `${x}% ${y}%`;
  });

  zoomContainer.addEventListener("mouseleave", () => {
    mainImage.style.transformOrigin = "center center";
  });

  //for thumbnail switching
  const thumbnails = document.querySelectorAll(".thumbnail");

thumbnails.forEach(thumb => {
  thumb.addEventListener("click", () => {
    mainImage.src = thumb.src;
  });
});


