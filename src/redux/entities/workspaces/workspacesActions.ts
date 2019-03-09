import { createAsyncAction, createStandardAction } from 'typesafe-actions';
import { isNil, set } from 'lodash';
import { buildThrottler } from '~/redux/utils';
import {
  apiCreateClockifyWorkspace,
  apiFetchClockifyWorkspaces,
  apiFetchTogglWorkspaceSummaryForYear,
} from '../api/workspaces';
import { showFetchErrorNotification } from '~/redux/app/appActions';
import { selectTogglUserEmail } from '~/redux/credentials/credentialsSelectors';
import * as clientsActions from '~/redux/entities/clients/clientsActions';
import * as projectsActions from '~/redux/entities/projects/projectsActions';
import * as tagsActions from '~/redux/entities/tags/tagsActions';
import * as tasksActions from '~/redux/entities/tasks/tasksActions';
import * as timeEntriesActions from '~/redux/entities/timeEntries/timeEntriesActions';
import * as userGroupsActions from '../userGroups/userGroupsActions';
import * as usersActions from '~/redux/entities/users/usersActions';
import { selectTogglIncludedWorkspaceNames } from './workspacesSelectors';
import {
  EntityGroup,
  EntityModel,
  ReduxDispatch,
  ReduxGetState,
  ToolName,
} from '~/types/commonTypes';
import {
  ClockifyWorkspace,
  TogglSummaryReportDataModel,
  TogglWorkspace,
  WorkspaceModel,
} from '~/types/workspacesTypes';

export const clockifyWorkspacesFetch = createAsyncAction(
  '@workspaces/CLOCKIFY_FETCH_REQUEST',
  '@workspaces/CLOCKIFY_FETCH_SUCCESS',
  '@workspaces/CLOCKIFY_FETCH_FAILURE',
)<void, ClockifyWorkspace[], void>();

export const togglWorkspacesFetch = createAsyncAction(
  '@workspaces/TOGGL_FETCH_REQUEST',
  '@workspaces/TOGGL_FETCH_SUCCESS',
  '@workspaces/TOGGL_FETCH_FAILURE',
)<void, TogglWorkspace[], void>();

export const togglWorkspaceSummaryFetch = createAsyncAction(
  '@workspaces/TOGGL_SUMMARY_FETCH_REQUEST',
  '@workspaces/TOGGL_SUMMARY_FETCH_SUCCESS',
  '@workspaces/TOGGL_SUMMARY_FETCH_FAILURE',
)<
  void,
  { workspaceId: string; inclusionsByYear: Record<string, boolean> },
  void
>();

export const clockifyWorkspaceTransfer = createAsyncAction(
  '@workspaces/CLOCKIFY_TRANSFER_REQUEST',
  '@workspaces/CLOCKIFY_TRANSFER_SUCCESS',
  '@workspaces/CLOCKIFY_TRANSFER_FAILURE',
)<void, ClockifyWorkspace[], void>();

export const appendUserIdsToWorkspace = createStandardAction(
  '@workspaces/APPEND_USER_IDS',
)<{ toolName: ToolName; workspaceId: string; userIds: string[] }>();

export const updateIsWorkspaceIncluded = createStandardAction(
  '@workspaces/UPDATE_IS_INCLUDED',
)<string>();

export const updateIsWorkspaceYearIncluded = createStandardAction(
  '@workspaces/UPDATE_IS_YEAR_INCLUDED',
)<{ workspaceId: string; year: string }>();

export const updateWorkspaceNameBeingFetched = createStandardAction(
  '@workspaces/UPDATE_NAME_BEING_FETCHED',
)<string | null>();

export const updateFetchTimeByTool = createStandardAction(
  '@workspaces/UPDATE_FETCH_TIME_BY_TOOL',
)<{ toolName: ToolName; fetchTime: Date | null }>();

export const resetContentsForTool = createStandardAction(
  '@workspaces/RESET_CONTENTS_FOR_TOOL',
)<ToolName>();

export const fetchClockifyWorkspaces = () => async (
  dispatch: ReduxDispatch,
  getState: ReduxGetState,
) => {
  const state = getState();

  dispatch(clockifyWorkspacesFetch.request());
  try {
    dispatch(resetContentsForTool(ToolName.Clockify));
    const togglIncludedNames = selectTogglIncludedWorkspaceNames(state);

    const workspaces = await apiFetchClockifyWorkspaces();
    const includedWorkspaces = workspaces.filter(({ name }) =>
      togglIncludedNames.includes(name),
    );

    return dispatch(clockifyWorkspacesFetch.success(includedWorkspaces));
  } catch (error) {
    dispatch(showFetchErrorNotification(error));
    return dispatch(clockifyWorkspacesFetch.failure());
  }
};

export const fetchClockifyEntitiesInWorkspace = (
  workspaceRecord: WorkspaceModel,
) => async (dispatch: ReduxDispatch) => {
  const { name, id } = workspaceRecord;

  dispatch(updateWorkspaceNameBeingFetched(name));

  await dispatch(clientsActions.fetchClockifyClients(id));
  await dispatch(projectsActions.fetchClockifyProjects(id));
  await dispatch(tagsActions.fetchClockifyTags(id));
  await dispatch(tasksActions.fetchClockifyTasks(id));
  await dispatch(userGroupsActions.fetchClockifyUserGroups(id));
  await dispatch(usersActions.fetchClockifyUsers(id));
  await dispatch(timeEntriesActions.fetchClockifyTimeEntries(id));

  dispatch(updateWorkspaceNameBeingFetched(null));
  return dispatch(
    updateFetchTimeByTool({
      toolName: ToolName.Clockify,
      fetchTime: new Date(),
    }),
  );
};

export const fetchTogglEntitiesInWorkspace = (
  workspaceRecord: WorkspaceModel,
) => async (dispatch: ReduxDispatch) => {
  const { name, id, inclusionsByYear } = workspaceRecord;

  const inclusionYears = Object.entries(inclusionsByYear).reduce(
    (acc, [year, isIncluded]) => {
      if (!isIncluded) return acc;
      return [...acc, +year];
    },
    [],
  );

  dispatch(updateWorkspaceNameBeingFetched(name));

  await dispatch(clientsActions.fetchTogglClients(id));
  await dispatch(projectsActions.fetchTogglProjects(id));
  await dispatch(tagsActions.fetchTogglTags(id));
  await dispatch(tasksActions.fetchTogglTasks(id));
  await dispatch(userGroupsActions.fetchTogglUserGroups(id));
  await dispatch(usersActions.fetchTogglUsers(id));
  for (const inclusionYear of inclusionYears) {
    await dispatch(timeEntriesActions.fetchTogglTimeEntries(id, inclusionYear));
  }

  dispatch(updateWorkspaceNameBeingFetched(null));
  return dispatch(
    updateFetchTimeByTool({ toolName: ToolName.Toggl, fetchTime: new Date() }),
  );
};

export const fetchTogglWorkspaceSummary = (workspaceId: string) => async (
  dispatch: ReduxDispatch,
  getState: ReduxGetState,
) => {
  const state = getState();

  dispatch(togglWorkspaceSummaryFetch.request());
  try {
    const email = selectTogglUserEmail(state);
    const { promiseThrottle, throttledFn } = buildThrottler(
      apiFetchTogglWorkspaceSummaryForYear,
    );

    const inclusionsByYear = {};
    let yearToFetch = new Date().getFullYear();
    while (yearToFetch > 2007) {
      await promiseThrottle
        .add(
          // @ts-ignore
          throttledFn.bind(this, email, workspaceId, yearToFetch),
        )
        .then(({ data }: { data: TogglSummaryReportDataModel[] }) => {
          const entryCount = data.reduce(
            (acc, { items }) => acc + items.length,
            0,
          );
          if (entryCount > 0) set(inclusionsByYear, yearToFetch, true);
        });
      yearToFetch -= 1;
    }

    return dispatch(
      togglWorkspaceSummaryFetch.success({ workspaceId, inclusionsByYear }),
    );
  } catch (error) {
    dispatch(showFetchErrorNotification(error));
    return dispatch(togglWorkspaceSummaryFetch.failure());
  }
};

export const transferEntitiesToClockifyWorkspace = (
  workspaceRecord: WorkspaceModel,
) => async (dispatch: ReduxDispatch) => {
  const { name, id: togglWorkspaceId, linkedId } = workspaceRecord;
  let clockifyWorkspaceId = linkedId;

  dispatch(clockifyWorkspaceTransfer.request());
  try {
    dispatch(updateWorkspaceNameBeingFetched(name));
    if (isNil(linkedId)) {
      const workspace = await apiCreateClockifyWorkspace({ name });
      clockifyWorkspaceId = workspace.id;
      dispatch(clockifyWorkspaceTransfer.success([workspace]));
    }

    await dispatch(
      clientsActions.transferClientsToClockify(
        togglWorkspaceId,
        clockifyWorkspaceId,
      ),
    );
    await dispatch(
      projectsActions.transferProjectsToClockify(
        togglWorkspaceId,
        clockifyWorkspaceId,
      ),
    );
    await dispatch(
      tagsActions.transferTagsToClockify(togglWorkspaceId, clockifyWorkspaceId),
    );
    await dispatch(
      tasksActions.transferTasksToClockify(
        togglWorkspaceId,
        clockifyWorkspaceId,
      ),
    );
    await dispatch(
      userGroupsActions.transferUserGroupsToClockify(
        togglWorkspaceId,
        clockifyWorkspaceId,
      ),
    );
    // TODO: Follow up on this:
    // await dispatch(
    //   transferUsersToClockify(togglWorkspaceId, clockifyWorkspaceId),
    // );
    // TODO: Write a selector to get the appropriate time entries.
    // await dispatch(
    //   transferTimeEntriesToClockify(togglWorkspaceId, clockifyWorkspaceId),
    // );

    return dispatch(updateWorkspaceNameBeingFetched(null));
  } catch (error) {
    dispatch(showFetchErrorNotification(error));
    return dispatch(clockifyWorkspaceTransfer.failure());
  }
};

export const updateIsWorkspaceEntityIncluded = (
  entityGroup: EntityGroup,
  entityRecord: EntityModel,
) => (dispatch: ReduxDispatch) => {
  const updateAction = {
    [EntityGroup.Clients]: clientsActions.updateIsClientIncluded,
    [EntityGroup.Projects]: projectsActions.updateIsProjectIncluded,
    [EntityGroup.Tags]: tagsActions.updateIsTagIncluded,
    [EntityGroup.Tasks]: tasksActions.updateIsTaskIncluded,
    [EntityGroup.UserGroups]: userGroupsActions.updateIsUserGroupIncluded,
    [EntityGroup.Users]: usersActions.updateIsUserIncluded,
  }[entityGroup];

  return dispatch(updateAction(entityRecord.id));
};
