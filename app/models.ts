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

export interface InsuranceCompany {
  id: string;
  code: string;
  name: string;
}

export interface InsurancePolicy {
  id: string;
  code: string;
  project_id: string;
  insurance_company_id: string;
  start_date: string;
  end_date: string;
  details: string;
}

export interface Project {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  acronym: string;
  accumulation_amount: number;
  address: string;
  end_date: string;
  project_group: string;
  start_date: string;
}

export interface Subcontract {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  down_payment1: number;
  down_payment2: number;
  down_payment3: number;
}

interface BaseUser {
  id: string;
  create_date: string;
  update_date: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserCreate extends BaseUser {
  password: string;
  password_confirmation: string;
}

export interface UserStore extends BaseUser {
  password_hash: string;
}
