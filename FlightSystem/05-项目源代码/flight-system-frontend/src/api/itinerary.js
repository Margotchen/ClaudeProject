import request from '@/utils/request'

export const getItinerary = (orderId) => request.get(`/itineraries/${orderId}`)
export const downloadItineraryPDF = (orderId) => request.get(`/itineraries/${orderId}/pdf`, { responseType: 'blob' })
