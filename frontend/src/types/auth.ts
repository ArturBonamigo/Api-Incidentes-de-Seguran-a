export type UserProfile =
  | "ADMIN"
  | "USUARIO_COMUM"
  | "ANALISTA_SOC"
  | "GESTOR"
  | "AUDITOR";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  perfil: UserProfile;
  is_active: boolean;
  date_joined: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
};

export type EmployeeCreateRequest = RegisterRequest & {
  perfil: Exclude<UserProfile, "USUARIO_COMUM">;
  is_active: boolean;
};

export type EmployeeUpdateRequest = Partial<
  Pick<User, "email" | "first_name" | "last_name" | "perfil" | "is_active">
>;
