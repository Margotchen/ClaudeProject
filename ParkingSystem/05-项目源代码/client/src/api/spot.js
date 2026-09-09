import api from './index';

export function getSpots(params) {
  return api.get('/spots', { params });
}

export function getAreas() {
  return api.get('/spots/areas');
}

export function getMapStatus(params) {
  return api.get('/spots/map-status', { params });
}

export function createSpot(data) {
  return api.post('/spots', data);
}

export function updateSpot(id, data) {
  return api.put(`/spots/${id}`, data);
}

export function deleteSpot(id) {
  return api.delete(`/spots/${id}`);
}
