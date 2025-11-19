// Dashboard Charts using Chart.js
// ROSE Performance Management System

// ROSE color palette
const ROSE_COLORS = {
  primary: '#c12040',
  secondary: '#f57b51',
  tertiary: '#f5daaf',
  dark: '#231f1f',
  gradients: {
    red: ['#c12040', '#f57b51'],
    warm: ['#f57b51', '#f5daaf'],
    full: ['#c12040', '#f57b51', '#f5daaf']
  }
};

// Chart instances storage
const chartInstances = {};

// Destroy existing chart if it exists
function destroyChart(chartId) {
  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
    delete chartInstances[chartId];
  }
}

// Create Performance Trend Line Chart
function createPerformanceTrendChart(canvasId, data) {
  destroyChart(canvasId);
  
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const labels = data.map(d => d.label);
  const scores = data.map(d => d.score);
  
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Performance Score',
        data: scores,
        borderColor: ROSE_COLORS.primary,
        backgroundColor: 'rgba(193, 32, 64, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: ROSE_COLORS.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: 'Poppins',
              size: 12,
              weight: '600'
            },
            color: ROSE_COLORS.dark,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: ROSE_COLORS.dark,
          titleFont: {
            family: 'Poppins',
            size: 14,
            weight: '600'
          },
          bodyFont: {
            family: 'Arial',
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          grid: {
            color: 'rgba(245, 218, 175, 0.3)'
          },
          ticks: {
            font: {
              family: 'Poppins'
            },
            color: ROSE_COLORS.dark
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Poppins'
            },
            color: ROSE_COLORS.dark
          }
        }
      }
    }
  });
  
  return chartInstances[canvasId];
}

// Create Dimension Breakdown Pie Chart
function createDimensionPieChart(canvasId, data) {
  destroyChart(canvasId);
  
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const labels = data.map(d => d.dimension);
  const scores = data.map(d => d.score);
  
  // Generate colors from ROSE palette
  const backgroundColors = [
    'rgba(193, 32, 64, 0.8)',   // Primary red
    'rgba(245, 123, 81, 0.8)',  // Secondary orange
    'rgba(245, 218, 175, 0.8)', // Tertiary yellow
    'rgba(35, 31, 31, 0.8)'     // Dark
  ];
  
  const borderColors = [
    ROSE_COLORS.primary,
    ROSE_COLORS.secondary,
    ROSE_COLORS.tertiary,
    ROSE_COLORS.dark
  ];
  
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: scores,
        backgroundColor: backgroundColors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            font: {
              family: 'Poppins',
              size: 12,
              weight: '600'
            },
            color: ROSE_COLORS.dark,
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: ROSE_COLORS.dark,
          titleFont: {
            family: 'Poppins',
            size: 14,
            weight: '600'
          },
          bodyFont: {
            family: 'Arial',
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.toFixed(2);
              return label;
            }
          }
        }
      }
    }
  });
  
  return chartInstances[canvasId];
}

// Create Bar Chart for Comparisons
function createComparisonBarChart(canvasId, data) {
  destroyChart(canvasId);
  
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  // Handle both data formats: {label, value} or {dimension, score}
  const labels = data.map(d => d.label || d.dimension);
  const values = data.map(d => d.value || d.score);
  
  // Create gradient for bars
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, ROSE_COLORS.primary);
  gradient.addColorStop(1, ROSE_COLORS.secondary);
  
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Score',
        data: values,
        backgroundColor: gradient,
        borderColor: ROSE_COLORS.primary,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: ROSE_COLORS.dark,
          titleFont: {
            family: 'Poppins',
            size: 14,
            weight: '600'
          },
          bodyFont: {
            family: 'Arial',
            size: 12
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          grid: {
            color: 'rgba(245, 218, 175, 0.3)'
          },
          ticks: {
            font: {
              family: 'Poppins'
            },
            color: ROSE_COLORS.dark
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Poppins'
            },
            color: ROSE_COLORS.dark
          }
        }
      }
    }
  });
  
  return chartInstances[canvasId];
}

// Create Radar Chart for Multi-dimensional View
function createRadarChart(canvasId, data) {
  destroyChart(canvasId);
  
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const labels = data.map(d => d.dimension);
  const scores = data.map(d => d.score);
  
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Performance by Dimension',
        data: scores,
        backgroundColor: 'rgba(193, 32, 64, 0.2)',
        borderColor: ROSE_COLORS.primary,
        borderWidth: 3,
        pointBackgroundColor: ROSE_COLORS.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: 'Poppins',
              size: 12,
              weight: '600'
            },
            color: ROSE_COLORS.dark
          }
        },
        tooltip: {
          backgroundColor: ROSE_COLORS.dark,
          titleFont: {
            family: 'Poppins',
            size: 14,
            weight: '600'
          },
          bodyFont: {
            family: 'Arial',
            size: 12
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 5,
          grid: {
            color: 'rgba(245, 218, 175, 0.3)'
          },
          angleLines: {
            color: 'rgba(245, 218, 175, 0.3)'
          },
          ticks: {
            font: {
              family: 'Poppins'
            },
            color: ROSE_COLORS.dark,
            backdropColor: 'transparent'
          },
          pointLabels: {
            font: {
              family: 'Poppins',
              size: 11,
              weight: '600'
            },
            color: ROSE_COLORS.dark
          }
        }
      }
    }
  });
  
  return chartInstances[canvasId];
}

// Parse scorecard records and prepare data for charts
function prepareChartData(records) {
  if (!records || records.length === 0) return null;
  
  const trendData = [];
  const dimensionScores = {
    'Financial': [],
    'Customer': [],
    'Internal Process': [],
    'Learning & Growth': []
  };
  
  records.forEach(rec => {
    try {
      let scoresData = rec.Scores || rec.scores;
      let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
      
      if (Array.isArray(scoresArr)) {
        // Calculate total weighted score
        const totalScore = scoresArr.reduce((sum, s) => sum + (parseFloat(s.weighted) || 0), 0);
        
        // Add to trend data
        const year = rec.Year || rec.year || '2025';
        const month = rec.Month || rec.month || '1';
        const week = rec.Week || rec.week || '1';
        const label = `${year}-${String(month).padStart(2, '0')} W${week}`;
        
        trendData.push({
          label: label,
          score: totalScore,
          date: new Date(year, month - 1, week * 7)
        });
        
        // Accumulate dimension scores
        scoresArr.forEach(score => {
          const dim = score.dimension;
          if (dimensionScores[dim]) {
            const rating = parseFloat(score.rating) || 0;
            if (rating > 0) {
              dimensionScores[dim].push(rating);
            }
          }
        });
      }
    } catch (e) {
      console.error('Error parsing scores:', e);
    }
  });
  
  // Sort trend data by date
  trendData.sort((a, b) => a.date - b.date);
  
  // Calculate average dimension scores
  const dimensionAverages = [];
  Object.keys(dimensionScores).forEach(dim => {
    const scores = dimensionScores[dim];
    if (scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      dimensionAverages.push({
        dimension: dim,
        score: parseFloat(avg.toFixed(2))
      });
    }
  });
  
  return {
    trend: trendData,
    dimensions: dimensionAverages
  };
}

// Enhanced dashboard rendering with charts
function renderDashboardWithCharts(records, wrapId) {
  wrapId = wrapId || 'dashboardWrap';
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  
  if (!records || records.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">No data yet.</div>`;
    return;
  }
  
  // Prepare chart data
  const chartData = prepareChartData(records);
  
  // Calculate statistics
  const allScores = [];
  records.forEach(rec => {
    try {
      let scoresData = rec.Scores || rec.scores;
      let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
      if (Array.isArray(scoresArr)) {
        const score = scoresArr.reduce((sum, s) => sum + (parseFloat(s.weighted) || 0), 0);
        if (!isNaN(score)) allScores.push(score);
      }
    } catch (e) {}
  });
  
  const avgScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2) : '0.00';
  const bestScore = allScores.length > 0 ? Math.max(...allScores).toFixed(2) : '0.00';
  const lowestScore = allScores.length > 0 ? Math.min(...allScores).toFixed(2) : '0.00';
  
  let html = `
    <div class="dashboard-container">
      <!-- Overall Performance Card -->
      <div class="dashboard-card overall-card">
        <h3>📊 Overall Performance</h3>
        <div class="metric-grid">
          <div class="metric-item">
            <span class="metric-label">Total Submissions</span>
            <span class="metric-value">${allScores.length}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Average Score</span>
            <span class="metric-value">${avgScore}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Best Score</span>
            <span class="metric-value">${bestScore}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Lowest Score</span>
            <span class="metric-value">${lowestScore}</span>
          </div>
        </div>
      </div>
      
      <!-- Performance Trend Chart -->
      <div class="dashboard-card">
        <h3>📈 Performance Trend</h3>
        <canvas id="${wrapId}_trendChart"></canvas>
      </div>
      
      <!-- Dimension Breakdown -->
      <div class="dashboard-card">
        <h3>🎯 Performance by Dimension</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <canvas id="${wrapId}_pieChart"></canvas>
          </div>
          <div>
            <canvas id="${wrapId}_radarChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Dimension Comparison Bar Chart -->
      <div class="dashboard-card">
        <h3>📊 Dimension Comparison</h3>
        <canvas id="${wrapId}_barChart"></canvas>
      </div>
    </div>
  `;
  
  wrap.innerHTML = html;
  
  // Wait for DOM update and render charts
  setTimeout(() => {
    if (chartData && chartData.trend.length > 0) {
      createPerformanceTrendChart(`${wrapId}_trendChart`, chartData.trend);
    }
    
    if (chartData && chartData.dimensions.length > 0) {
      createDimensionPieChart(`${wrapId}_pieChart`, chartData.dimensions);
      createRadarChart(`${wrapId}_radarChart`, chartData.dimensions);
      createComparisonBarChart(`${wrapId}_barChart`, chartData.dimensions);
    }
  }, 100);
}

// Export functions to global scope
window.createPerformanceTrendChart = createPerformanceTrendChart;
window.createDimensionPieChart = createDimensionPieChart;
window.createComparisonBarChart = createComparisonBarChart;
window.createRadarChart = createRadarChart;
window.prepareChartData = prepareChartData;
window.renderDashboardWithCharts = renderDashboardWithCharts;
window.destroyChart = destroyChart;

console.log('📊 ROSE Dashboard Charts - Loaded successfully!');
