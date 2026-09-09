<template>
  <div ref="chartRef" style="width: 100%; height: 300px;"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const chartRef = ref();
let chart = null;

function initChart() {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  updateOption();

  const resize = () => chart.resize();
  window.addEventListener('resize', resize);
}

function updateOption() {
  if (!chart) return;
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.area)
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      type: 'bar',
      data: props.data.map(item => item.rate),
      itemStyle: { color: '#409eff' },
      barWidth: 40
    }]
  }, true);
}

onMounted(initChart);
watch(() => props.data, updateOption, { deep: true });
onUnmounted(() => {
  if (chart) chart.dispose();
});
</script>
