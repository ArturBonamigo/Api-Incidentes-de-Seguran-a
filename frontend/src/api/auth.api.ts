import {
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User
} from "../types/auth";
import { apiRequest } from "./httpClient";
import { loadAllPages } from "./pagination";

export function login(payload: LoginRequest) {
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function register(payload: RegisterRequest) {
  return apiRequest<User>("/auth/register/", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function getCurrentUser() {
  return apiRequest<User>("/auth/me/");
}

export function createEmployee(payload: EmployeeCreateRequest) {
  return apiRequest<User>("/users/", {
    method: "POST",
    body: payload
  });
}

export async function listUsers() {
  return loadAllPages<User>("/users/");
}

export function updateUser(id: number, payload: EmployeeUpdateRequest) {
  return apiRequest<User>(`/users/${id}/`, {
    method: "PATCH",
    body: payload
  });
}
