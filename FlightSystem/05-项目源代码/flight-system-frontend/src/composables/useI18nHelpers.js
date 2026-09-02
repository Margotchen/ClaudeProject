import { computed } from 'vue'
import { useI18n } from './useI18n.js'

export function useI18nHelpers() {
  const { t, locale } = useI18n()

  const currentLocale = computed(() => locale.value)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString(currentLocale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleTimeString(currentLocale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return `${formatDate(dateStr)} ${formatTime(dateStr)}`
  }

  const flightStatusType = (status) => {
    return ['', 'success', 'warning', 'danger'][status] || 'info'
  }

  const flightStatusText = (status) => {
    const map = {
      1: 'flightManage.normal',
      2: 'flightManage.delayed',
      3: 'flightManage.cancelled'
    }
    return t(map[status] || 'common.unknown')
  }

  const orderStatusType = (status) => {
    return ['warning', 'success', 'success', 'primary', 'info', 'info', 'danger'][status] || 'info'
  }

  const orderStatusText = (status) => {
    const map = {
      0: 'orderStatus.pending',
      1: 'orderStatus.paid',
      2: 'orderStatus.ticketed',
      3: 'orderStatus.checkedIn',
      4: 'orderStatus.changed',
      5: 'orderStatus.refunded',
      6: 'orderStatus.cancelled'
    }
    return t(map[status] || 'common.unknown')
  }

  const cabinClassText = (cabin) => {
    const map = {
      economy: 'cabin.economy',
      business: 'cabin.business',
      first: 'cabin.first'
    }
    return t(map[cabin] || 'common.unknown')
  }

  const capitalize = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return {
    locale: currentLocale,
    t,
    formatDate,
    formatTime,
    formatDateTime,
    flightStatusType,
    flightStatusText,
    orderStatusType,
    orderStatusText,
    cabinClassText,
    capitalize
  }
}

export default useI18nHelpers
