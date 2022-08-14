import { Role } from './enums';

export interface User {
  id: string;
  create_date: string;
  update_date: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
}
