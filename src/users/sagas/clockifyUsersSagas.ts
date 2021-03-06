import { SagaIterator } from "@redux-saga/types";
import { call, delay, put } from "redux-saga/effects";
import { CLOCKIFY_API_DELAY } from "~/constants";
import * as reduxUtils from "~/redux/reduxUtils";
import { incrementEntityGroupTransferCompletedCount } from "~/allEntities/allEntitiesActions";
import { EntityGroup, ToolName, UserModel } from "~/typeDefs";

export interface ClockifyHourlyRateResponseModel {
  amount: number;
  currency: string;
}

export interface ClockifyMembershipResponseModel {
  hourlyRate: ClockifyHourlyRateResponseModel;
  membershipStatus: string;
  membershipType: string;
  targetId: string;
  userId: string;
}

type WeekStart =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface ClockifyUserResponseModel {
  activeWorkspace: string;
  defaultWorkspace: string;
  email: string;
  id: string;
  memberships: ClockifyMembershipResponseModel[];
  name: string;
  profilePicture: string;
  settings: {
    collapseAllProjectLists: boolean;
    dashboardPinToTop: boolean;
    dashboardSelection: "ME" | "TEAM";
    dashboardViewType: "PROJECT" | "BILLABILITY";
    dateFormat: string;
    isCompactViewOn: boolean;
    longRunning: boolean;
    projectListCollapse: number;
    sendNewsletter: boolean;
    summaryReportSettings: {
      group: string;
      subgroup: string;
    };
    timeFormat: string;
    timeTrackingManual: boolean;
    timeZone: string;
    weekStart: WeekStart;
    weeklyUpdates: boolean;
  };
  status: "ACTIVE" | "PENDING_EMAIL_VERIFICATION" | "DELETED";
}

/**
 * Sends invites to the array of specified emails.
 */
export function* createClockifyUsersSaga(
  emailsByWorkspaceId: Record<string, string[]>,
): SagaIterator {
  for (const [workspaceId, emails] of Object.entries(emailsByWorkspaceId)) {
    yield put(incrementEntityGroupTransferCompletedCount(EntityGroup.Users));
    yield call(inviteClockifyUsers, emails, workspaceId);
    yield delay(CLOCKIFY_API_DELAY);
  }
}

/**
 * Deletes all specified source clients from Clockify.
 */
export function* deleteClockifyUsersSaga(
  sourceUsers: UserModel[],
): SagaIterator {
  yield call(reduxUtils.deleteEntitiesForTool, {
    toolName: ToolName.Clockify,
    sourceRecords: sourceUsers,
    apiDeleteFunc: deleteClockifyUser,
  });
}

/**
 * Fetches all users in Clockify workspaces and returns array of transformed
 * users.
 */
export function* fetchClockifyUsersSaga(): SagaIterator<UserModel[]> {
  return yield call(reduxUtils.fetchEntitiesForTool, {
    toolName: ToolName.Clockify,
    apiFetchFunc: fetchClockifyUsersInWorkspace,
  });
}

/**
 * Invites Clockify users to workspace.
 * @see https://clockify.github.io/clockify_api_docs/#operation--workspaces--workspaceId--users-post
 * @deprecated This is part of the old API and will need to be updated as soon
 *             as the v1 endpoint is available.
 */
function* inviteClockifyUsers(
  sourceEmails: string[],
  targetWorkspaceId: string,
): SagaIterator {
  const usersRequest = { emails: sourceEmails };
  yield call(
    reduxUtils.fetchObject,
    `/clockify/api/workspaces/${targetWorkspaceId}/users`,
    {
      method: "POST",
      body: usersRequest,
    },
  );
}

/**
 * Deletes the specified Clockify user.
 * @see https://clockify.github.io/clockify_api_docs/#operation--users--userId--delete-post
 * @deprecated This is part of the old API and will need to be updated as soon
 *             as the v1 endpoint is available.
 */
function* deleteClockifyUser(sourceUser: UserModel): SagaIterator {
  yield call(
    reduxUtils.fetchObject,
    `/clockify/api/users/${sourceUser.id}/delete`,
    { method: "POST" },
  );
}

/**
 * Fetches Clockify users in specified workspace.
 * @see https://clockify.me/developers-api#operation--v1-workspaces--workspaceId--users-get
 */
function* fetchClockifyUsersInWorkspace(
  workspaceId: string,
): SagaIterator<UserModel[]> {
  const clockifyUsers: ClockifyUserResponseModel[] = yield call(
    reduxUtils.fetchPaginatedFromClockify,
    `/clockify/api/v1/workspaces/${workspaceId}/users`,
  );

  return clockifyUsers.map(clockifyUser =>
    transformFromResponse(clockifyUser, workspaceId),
  );
}

function transformFromResponse(
  user: ClockifyUserResponseModel,
  workspaceId: string,
): UserModel {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: null,
    isActive: user.status === "ACTIVE",
    userGroupIds: [],
    workspaceId,
    entryCount: 0,
    linkedId: null,
    isIncluded: true,
    memberOf: EntityGroup.Users,
  };
}
