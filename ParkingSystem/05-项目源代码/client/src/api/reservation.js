import api from './index';

export function createReservation(data) {
  return api.post('/reservations', data);
}

export function getMyReservations(params) {
  return api.get('/reservations/my', { params });
}

export function getAllReservations(params) {
  return api.get('/reservations', { params });
}

export function cancelReservation(id) {
  return api.post(`/reservations/${id}/cancel`);
}

export function checkinReservation(id, data) {
  return api.post(`/reservations/${id}/checkin`, data);
}

export function checkinByPlate(data) {
  return api.post('/reservations/checkin-by-plate', data);
}
