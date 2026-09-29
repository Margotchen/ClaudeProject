import request from '../utils/request'

export function listRoles() {
  return request.get('/role/list')
}
