import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FlightWeekBar from '@/components/FlightWeekBar.vue'
import { locale } from '@/locales'

const items = [
  { date: '2026-09-01', price: 520, isLowest: false },
  { date: '2026-09-02', price: 480, isLowest: true },
  { date: '2026-09-03', price: null, isLowest: false },
  { date: '2026-09-04', price: 500, isLowest: false },
  { date: '2026-09-05', price: 550, isLowest: false },
  { date: '2026-09-06', price: 600, isLowest: false },
  { date: '2026-09-07', price: 510, isLowest: false }
]

afterEach(() => {
  locale.value = 'zh-CN'
})

describe('FlightWeekBar', () => {
  it('renders 7 day cells', () => {
    const wrapper = mount(FlightWeekBar, {
      props: { items, selectedDate: '2026-09-01' }
    })
    expect(wrapper.findAll('.week-day').length).toBe(7)
  })

  it('emits select with the date when a day cell is clicked', async () => {
    const wrapper = mount(FlightWeekBar, {
      props: { items, selectedDate: '2026-09-01' }
    })
    await wrapper.findAll('.week-day')[1].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['2026-09-02'])
  })

  it('renders a lowest-price tag for the cheapest day', () => {
    const wrapper = mount(FlightWeekBar, {
      props: { items, selectedDate: '2026-09-01' }
    })
    expect(wrapper.findAll('.lowest-tag').length).toBe(1)
  })

  it('emits prevWeek and nextWeek when navigation arrows are clicked', async () => {
    const wrapper = mount(FlightWeekBar, {
      props: { items, selectedDate: '2026-09-01' }
    })
    await wrapper.find('.prev-week').trigger('click')
    await wrapper.find('.next-week').trigger('click')
    expect(wrapper.emitted('prevWeek')).toBeTruthy()
    expect(wrapper.emitted('nextWeek')).toBeTruthy()
  })

  it('renders weekday labels in the current locale', () => {
    locale.value = 'en-US'
    const wrapper = mount(FlightWeekBar, {
      props: { items, selectedDate: '2026-09-01' }
    })
    expect(wrapper.text()).toContain('Tue')
  })
})
