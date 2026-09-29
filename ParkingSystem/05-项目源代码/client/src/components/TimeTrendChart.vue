<template>
  <div ref="chartRef" style="width: 100%; height: 300px;"></div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { useThemeStore } from '@/store/theme';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.theme === 'dark');

const chartRef = ref();
let chart = null;

function initChart() {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value, isDark.value ? 'dark' : null);
  updateOption();

  const resize = () => chart.resize();
  window.addEventListener('resize', resize);
}

function updateOption() {
  if (!chart) return;
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['上午', '下午', '全天'] },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [
      { name: '上午', type: 'line', data: props.data.map(item => item.morning), smooth: true },
      { name: '下午', type: 'line', data: props.data.map(item => item.afternoon), smooth: true },
      { name: '全天', type: 'line', data: props.data.map(item => item.allDay), smooth: true }
    ]
  }, true);
}

onMounted(initChart);
watch(() => props.data, updateOption, { deep: true });
watch(isDark, () => {
  // 主题切换后 ECharts 需重建实例以应用暗色配色
  if (chart) chart.dispose();
  initChart();
});
onUnmounted(() => {
  if (chart) chart.dispose();
});
</script>
