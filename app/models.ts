import { MaritalStatus, Role, Sex } from './enums';

export interface Employee {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  date_of_birth: string;
  sex: Sex;
  marital_status: MaritalStatus;
  referee: string;
  emergency_name: string;
  emergency_address: string;
  emergency_phone: string;
  hired_date: string;
  skill: string;
  hourly_rate: number;
  overtime_rate: number;
  project_id: string;
  position_id: string;
  subcontract_id: string;
}

export interface User {
  id: string;
  create_date: string;
  update_date: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
}

export interface insurance_policy {
  id: string; 
  policy_code: string;
  project_id: string;
  insurance_company_id: string;
  policy_details: string;
  comment: string;
  start_date: string;
  end_date: string;
}
