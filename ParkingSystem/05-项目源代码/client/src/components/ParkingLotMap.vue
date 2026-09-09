<template>
  <div class="parking-map-container">
    <div class="map-canvas" ref="mapRef">
      <svg :width="mapWidth" :height="mapHeight">
        <!-- 区域背景 -->
        <g v-for="area in areas" :key="area.code">
          <rect
            :x="getAreaX(area.code)"
            y="20"
            width="200"
            :height="mapHeight - 40"
            fill="#f5f7fa"
            stroke="#dcdfe6"
            stroke-width="1"
            rx="4"
          />
          <text
            :x="getAreaX(area.code) + 100"
            y="40"
            text-anchor="middle"
            class="area-label"
          >{{ area.name }}</text>
        </g>

        <!-- 车位 -->
        <g
          v-for="spot in displaySpots"
          :key="spot.id"
          class="spot-item"
          :class="{ clickable: isClickable(spot) }"
          @click="handleSpotClick(spot)"
        >
          <rect
            :x="spot.position_x"
            :y="spot.position_y"
            width="50"
            height="30"
            rx="3"
            :fill="getSpotColor(spot)"
            stroke="#909399"
            stroke-width="1"
          />
          <text
            :x="spot.position_x + 25"
            :y="spot.position_y + 20"
            text-anchor="middle"
            class="spot-code"
          >{{ spot.spot_code }}</text>
        </g>
      </svg>
    </div>

    <div class="legend">
      <span class="legend-item"><i class="dot available"></i>空闲</span>
      <span class="legend-item"><i class="dot occupied"></i>已占用</span>
      <span class="legend-item"><i class="dot fixed"></i>固定车位</span>
      <span class="legend-item"><i class="dot charging"></i>充电车位</span>
      <span class="legend-item"><i class="dot visitor"></i>访客车位</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  spots: {
    type: Array,
    default: () => []
  },
  areas: {
    type: Array,
    default: () => []
  },
  selectable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['select']);

const mapWidth = 900;
const mapHeight = 300;

const areaOrder = ['A', 'B', 'C', 'D'];

const displaySpots = computed(() => {
  return props.spots.map(spot => ({
    ...spot,
    real_time_status: spot.real_time_status || spot.status
  }));
});

function getAreaX(code) {
  const idx = areaOrder.indexOf(code);
  return idx * 220 + 20;
}

function getSpotColor(spot) {
  if (spot.real_time_status === 'occupied') return '#f56c6c';
  if (spot.spot_type === 'fixed') return '#909399';
  if (spot.spot_type === 'charging') return '#409eff';
  if (spot.spot_type === 'visitor') return '#e6a23c';
  return '#67c23a';
}

function isClickable(spot) {
  return props.selectable && spot.real_time_status !== 'occupied' && spot.spot_type !== 'fixed' && spot.status !== 'maintenance';
}

function handleSpotClick(spot) {
  if (!isClickable(spot)) return;
  emit('select', spot);
}
</script>

<style scoped lang="scss">
.parking-map-container {
  .map-canvas {
    overflow-x: auto;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 10px;
  }

  .spot-item {
    cursor: default;
    transition: all 0.2s;

    &.clickable:hover rect {
      fill: #85ce61;
      cursor: pointer;
    }
  }

  .spot-code {
    font-size: 10px;
    fill: #fff;
    pointer-events: none;
  }

  .area-label {
    font-size: 14px;
    fill: #606266;
    font-weight: bold;
  }

  .legend {
    display: flex;
    gap: 20px;
    margin-top: 16px;
    flex-wrap: wrap;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #606266;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      display: inline-block;

      &.available { background: #67c23a; }
      &.occupied { background: #f56c6c; }
      &.fixed { background: #909399; }
      &.charging { background: #409eff; }
      &.visitor { background: #e6a23c; }
    }
  }
}
</style>
