import { ClockifyMembership } from './userTypes';
import { ClockifyTask } from './tasksTypes';

export enum ClockifyEstimateType {
  Auto = 'AUTO',
  Manual = 'MANUAL',
}

export interface ClockifyEstimate {
  estimate: string;
  type: ClockifyEstimateType;
}

export interface ClockifyProject {
  id: string;
  name: string;
  hourlyRate: string | null;
  clientId: string;
  client: string | null;
  workspaceId: string;
  billable: boolean;
  memberships: ClockifyMembership[];
  color: string;
  estimate: ClockifyEstimate;
  archived: boolean;
  tasks: ClockifyTask[];
  public: boolean;
}

export interface TogglProject {
  id: number;
  wid: number;
  cid: number;
  name: string;
  billable: boolean;
  is_private: boolean;
  active: boolean;
  template: boolean;
  at: string;
  created_at: string;
  color: string;
  auto_estimates: boolean;
  actual_hours: number;
  hex_color: string;
}

export interface TogglProjectUser {
  id: number;
  pid: number;
  uid: number;
  wid: number;
  manager: boolean;
  rate: number;
}

export interface ProjectUserModel {
  id: string;
  isManager: boolean | null;
}

export interface ProjectModel {
  id: string;
  name: string;
  workspaceId: string;
  clientId: string;
  isBillable: boolean;
  isPublic: boolean;
  isActive: boolean;
  color: string;
  users: ProjectUserModel[];
  isIncluded: boolean;
}
