import api from './index';

export function getVehicles() {
  return api.get('/vehicles');
}

export function createVehicle(data) {
  return api.post('/vehicles', data);
}

export function updateVehicle(id, data) {
  return api.put(`/vehicles/${id}`, data);
}

export function deleteVehicle(id) {
  return api.delete(`/vehicles/${id}`);
}
