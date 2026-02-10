<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface AttendanceStats {
  month: string;
  count: number;
}

interface Props {
  stats: AttendanceStats[];
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: 280
});

const chartData = computed(() => {
  return {
    labels: props.stats.map(s => {
      const [year, month] = s.month.split('-');
      const date = new Date(parseInt(year!), parseInt(month!) - 1);
      return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Jumlah Kehadiran',
        data: props.stats.map(s => s.count),
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#1e3a8a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };
});

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 13,
        weight: 600
      },
      bodyFont: {
        size: 12
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 5,
        color: 'var(--color-text-secondary)',
        font: {
          size: 11
        }
      },
      grid: {
        color: '#f1f5f9',
        drawBorder: false
      }
    },
    x: {
      ticks: {
        color: 'var(--color-text-secondary)',
        font: {
          size: 11
        }
      },
      grid: {
        display: false
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}));
</script>

<template>
  <div class="attendance-chart-wrapper" :style="{ height: `${height}px` }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.attendance-chart-wrapper {
  position: relative;
  width: 100%;
}
</style>
