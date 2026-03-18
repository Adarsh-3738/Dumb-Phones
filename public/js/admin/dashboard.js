
    
    // Revenue Line Chart configuration
    const ctxRevenue = document.getElementById("revenueChart");
    
    // Chart configuration
    new Chart(ctxRevenue, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [{
          label: "Revenue (₹)",
          data: rawMonthlyData,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)", // Light blue fill
          borderWidth: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#2563eb",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Smooth curves
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a",
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 14, family: "'Inter', sans-serif", weight: "bold" },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return '₹ ' + context.parsed.y.toLocaleString('en-IN');
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { font: { family: "'Inter', sans-serif" }, color: "#64748b" }
          },
          y: {
            grid: { color: "#e2e8f0", borderDash: [5, 5], drawBorder: false },
            ticks: {
              font: { family: "'Inter', sans-serif" }, 
              color: "#64748b",
              callback: function(value) { return '₹' + value.toLocaleString('en-IN'); }
            }
          }
        }
      }
    });

    // Order Status Doughnut Chart
    const ctxStatus = document.getElementById("statusChart");
    
    // Generate harmonious colors for doughnut based on status
    const statusColorsMap = {
      'Delivered': '#10b981', // green
      'Pending': '#94a3b8',   // slate
      'Processing': '#3b82f6', // blue
      'Shipped': '#f59e0b',    // yellow/orange
      'Out for Delivery': '#d97706',
      'Cancelled': '#ef4444',  // red
      'Returned': '#be185d',   // pink
      'Return Request': '#f43f5e'
    };

    const backgroundColors = rawStatusLabels.map(label => statusColorsMap[label] || '#cbd5e1');

    new Chart(ctxStatus, {
      type: "doughnut",
      data: {
        labels: rawStatusLabels,
        datasets: [{
          data: rawStatusCounts,
          backgroundColor: backgroundColors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'Inter', sans-serif", size: 12 },
              color: "#334155"
            }
          },
          tooltip: {
            backgroundColor: "#0f172a",
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 14, family: "'Inter', sans-serif", weight: "bold" },
            padding: 12,
            cornerRadius: 8
          }
        }
      }
    });

    // Re-initialize lucide icons for new elements
    if(window.lucide) {
      lucide.createIcons();
    }
  