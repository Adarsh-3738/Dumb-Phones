let revenueChartObj = null;
let statusChartObj = null;

function initDashboardCharts() {
  const ctxRevenue = document.getElementById("revenueChart");
  const ctxStatus = document.getElementById("statusChart");

  if (!ctxRevenue || !ctxStatus) return;
  if (typeof Chart === 'undefined') return;

  // Destroy existing chart instances if re-initialized
  if (revenueChartObj) {
    try { revenueChartObj.destroy(); } catch (e) {}
    revenueChartObj = null;
  }
  if (statusChartObj) {
    try { statusChartObj.destroy(); } catch (e) {}
    statusChartObj = null;
  }

  const monthlyData = (typeof rawMonthlyData !== 'undefined') ? rawMonthlyData : [];
  const statusLabels = (typeof rawStatusLabels !== 'undefined') ? rawStatusLabels : [];
  const statusCounts = (typeof rawStatusCounts !== 'undefined') ? rawStatusCounts : [];

  // 1. Line Chart
  revenueChartObj = new Chart(ctxRevenue, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [{
        label: "Revenue (₹)",
        data: monthlyData,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#2563eb",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
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

  // 2. Doughnut Chart
  const statusColorsMap = {
    'Delivered': '#10b981',
    'Pending': '#94a3b8',
    'Processing': '#3b82f6',
    'Shipped': '#f59e0b',
    'Out for Delivery': '#d97706',
    'Cancelled': '#ef4444',
    'Returned': '#be185d',
    'Return Request': '#f43f5e'
  };

  const backgroundColors = statusLabels.map(label => statusColorsMap[label] || '#cbd5e1');

  statusChartObj = new Chart(ctxStatus, {
    type: "doughnut",
    data: {
      labels: statusLabels,
      datasets: [{
        data: statusCounts,
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
}

window.fetchChartData = async function() {
  const filterSelect = document.getElementById('chartFilter');
  if (!filterSelect || !revenueChartObj) return;
  const filter = filterSelect.value;
  const title = document.getElementById('revenueChartTitle');
  
  if (filter === 'yearly') title.innerText = 'Yearly Revenue (Last 5 Years)';
  else if (filter === 'weekly') title.innerText = 'Weekly Revenue (Last 7 Days)';
  else title.innerText = 'Monthly Revenue (' + new Date().getFullYear() + ')';

  try {
    const response = await fetch('/admin/dashboard/chart-data?filter=' + filter);
    const resData = await response.json();
    
    if (resData.success) {
      revenueChartObj.data.labels = resData.labels;
      revenueChartObj.data.datasets[0].data = resData.data;
      revenueChartObj.update();
    }
  } catch (err) {
    console.error('Failed to fetch chart data:', err);
  }
};

// Initialize immediately when script loads
initDashboardCharts();

// Re-initialize lucide icons
if (window.lucide) {
  lucide.createIcons();
}