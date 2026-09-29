<template>
  <div class="flight-week-bar">
    <div class="week-nav prev-week" @click="$emit('prevWeek')">&#8249;</div>

    <div class="week-days">
      <div
        v-for="item in items"
        :key="item.date"
        class="week-day"
        :class="{ selected: item.date === selectedDate, lowest: item.isLowest }"
        @click="$emit('select', item.date)"
      >
        <div class="weekday">{{ formatWeekday(item.date) }}</div>
        <div class="date">{{ formatDate(item.date) }}</div>
        <div class="price">
          <span v-if="item.price !== null && item.price !== undefined">¥{{ item.price }}</span>
          <span v-else>--</span>
        </div>
        <div v-if="item.isLowest" class="lowest-tag">{{ lowestText }}</div>
      </div>
    </div>

    <div class="week-nav next-week" @click="$emit('nextWeek')">&#8250;</div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  selectedDate: { type: String, default: '' },
  lowestText: { type: String, default: '低' }
})

defineEmits(['select', 'prevWeek', 'nextWeek'])

import { locale } from '@/locales'

function formatWeekday(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString(locale.value, { weekday: 'short' })
}

function formatDate(dateStr) {
  return dateStr.slice(5)
}
</script>

<style scoped>
.flight-week-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.week-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-bg-base);
  cursor: pointer;
  transition: background-color 0.2s;
}

.week-nav:hover {
  background-color: var(--color-border);
}

.week-days {
  flex: 1;
  display: flex;
  gap: 8px;
}

.week-day {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 10px 4px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.week-day:hover {
  border-color: var(--color-primary);
}

.week-day.selected {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.weekday {
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-bottom: 4px;
}

.week-day.selected .weekday {
  color: var(--color-primary);
}

.date {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.price {
  font-size: 13px;
  color: var(--color-danger);
}

.lowest-tag {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: var(--color-warning);
  color: #fff;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 4px;
}
</style>
