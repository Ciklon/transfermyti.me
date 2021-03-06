import { SagaIterator } from "@redux-saga/types";
import { call, delay, put } from "redux-saga/effects";
import { CLOCKIFY_API_DELAY } from "~/constants";
import { fetchArray, fetchObject } from "~/redux/reduxUtils";
import { incrementEntityGroupTransferCompletedCount } from "~/allEntities/allEntitiesActions";
import { ClockifyMembershipResponseModel } from "~/users/sagas/clockifyUsersSagas";
import { EntityGroup, WorkspaceModel } from "~/typeDefs";

interface ClockifyWorkspaceSettingsResponseModel {
  timeRoundingInReports: boolean;
  onlyAdminsSeeBillableRates: boolean;
  onlyAdminsCreateProject: boolean;
  onlyAdminsSeeDashboard: boolean;
  defaultBillableProjects: boolean;
  lockTimeEntries: string | null;
  round: {
    round: string;
    minutes: string;
  };
  projectFavorites: boolean;
  canSeeTimeSheet: boolean;
  projectPickerSpecialFilter: boolean;
  forceProjects: boolean;
  forceTasks: boolean;
  forceTags: boolean;
  forceDescription: boolean;
  onlyAdminsSeeAllTimeEntries: boolean;
  onlyAdminsSeePublicProjectsEntries: boolean;
  trackTimeDownToSecond: boolean;
  projectGroupingLabel: string;
}

interface ClockifyWorkspaceResponseModel {
  id: string;
  name: string;
  hourlyRate: {
    amount: number;
    currency: string;
  };
  memberships: ClockifyMembershipResponseModel[];
  workspaceSettings: ClockifyWorkspaceSettingsResponseModel;
  imageUrl: string;
}

/**
 * Creates Clockify workspaces for transfer and returns array of transformed
 * workspaces.
 */
export function* createClockifyWorkspacesSaga(
  sourceWorkspaces: WorkspaceModel[],
): SagaIterator<WorkspaceModel[]> {
  const targetWorkspaces: WorkspaceModel[] = [];

  for (const sourceWorkspace of sourceWorkspaces) {
    const targetWorkspace = yield call(
      createClockifyWorkspace,
      sourceWorkspace,
    );
    targetWorkspaces.push(targetWorkspace);

    yield put(
      incrementEntityGroupTransferCompletedCount(EntityGroup.Workspaces),
    );

    yield delay(CLOCKIFY_API_DELAY);
  }

  return targetWorkspaces;
}

/**
 * Fetches all workspaces from Clockify and returns array of transformed
 * workspaces.
 * @see https://clockify.me/developers-api#operation--v1-workspaces-get
 */
export function* fetchClockifyWorkspacesSaga(): SagaIterator<WorkspaceModel[]> {
  const clockifyWorkspaces: ClockifyWorkspaceResponseModel[] = yield call(
    fetchArray,
    "/clockify/api/v1/workspaces",
  );

  return clockifyWorkspaces.map(transformFromResponse);
}

/**
 * Creates a new Clockify workspace.
 * @see https://clockify.me/developers-api#operation--v1-workspaces-post
 */
function* createClockifyWorkspace(
  sourceWorkspace: WorkspaceModel,
): SagaIterator<WorkspaceModel> {
  const workspaceRequest = { name: sourceWorkspace.name };
  const clockifyWorkspace = yield call(
    fetchObject,
    `/clockify/api/v1/workspaces`,
    { method: "POST", body: workspaceRequest },
  );

  return transformFromResponse(clockifyWorkspace);
}

function transformFromResponse(
  workspace: ClockifyWorkspaceResponseModel,
): WorkspaceModel {
  return {
    id: workspace.id,
    name: workspace.name,
    userIds: [],
    isAdmin: true,
    workspaceId: workspace.id,
    entryCount: 0,
    linkedId: null,
    isIncluded: false,
    memberOf: EntityGroup.Workspaces,
  };
}
