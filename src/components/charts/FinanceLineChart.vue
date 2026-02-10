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

interface FinanceData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

interface Props {
  data: FinanceData[];
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: 180
});

const chartData = computed(() => {
  return {
    labels: props.data.map(d => d.monthLabel),
    datasets: [
      {
        label: 'Pemasukan',
        data: props.data.map(d => d.income),
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#1e3a8a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Pengeluaran',
        data: props.data.map(d => d.expense),
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#94a3b8',
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
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 12,
        font: {
          size: 12,
          weight: 500
        },
        color: 'var(--color-text-secondary)'
      }
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
      },
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const yValue = context.parsed.y;
          if (yValue === null) return label;
          const value = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(yValue);
          return `${label}: ${value}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => {
          return new Intl.NumberFormat('id-ID', {
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value as number);
        },
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
  <div class="finance-chart-wrapper" :style="{ height: `${height}px` }">
    <Line v-if="data.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="empty-state">
      <p class="text-secondary text-sm">Belum ada data transaksi keuangan.</p>
    </div>
  </div>
</template>

<style scoped>
.finance-chart-wrapper {
  position: relative;
  width: 100%;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-8);
  text-align: center;
}
</style>
