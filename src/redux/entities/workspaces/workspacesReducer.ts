import { getType } from 'typesafe-actions';
import { handleActions, combineActions } from 'redux-actions';
import { cloneDeep, get, uniq } from 'lodash';
import {
  getEntityNormalizedState,
  updateIsEntityIncluded,
} from '~/redux/utils';
import * as workspacesActions from './workspacesActions';
import {
  EntityGroup,
  EntityType,
  ReduxAction,
  ReduxStateEntryForTool,
  ToolName,
} from '~/types/commonTypes';
import {
  ClockifyWorkspace,
  TogglWorkspace,
  WorkspaceModel,
} from '~/types/workspacesTypes';

interface LatestFetchTimesModel {
  clockify: Date | null;
  toggl: Date | null;
}

export interface WorkspacesState {
  readonly clockify: ReduxStateEntryForTool<WorkspaceModel>;
  readonly toggl: ReduxStateEntryForTool<WorkspaceModel>;
  readonly fetchTimesByTool: LatestFetchTimesModel;
  readonly workspaceNameBeingFetched: string | null;
  readonly isFetching: boolean;
}

export const initialState: WorkspacesState = {
  clockify: {
    byId: {},
    idValues: [],
  },
  toggl: {
    byId: {},
    idValues: [],
  },
  fetchTimesByTool: {
    clockify: null,
    toggl: null,
  },
  workspaceNameBeingFetched: null,
  isFetching: false,
};

const schemaProcessStrategy = (
  value: ClockifyWorkspace | TogglWorkspace,
): WorkspaceModel => ({
  id: value.id.toString(),
  name: value.name,
  userIds: [],
  inclusionsByYear: {},
  isAdmin: get(value, 'admin', null),
  entryCount: 0,
  linkedId: null,
  isIncluded: true,
});

export default handleActions(
  {
    [combineActions(
      getType(workspacesActions.clockifyWorkspacesFetch.success),
      getType(workspacesActions.clockifyWorkspaceTransfer.success),
    )]: (
      state: WorkspacesState,
      { payload: workspaces }: ReduxAction<ClockifyWorkspace[]>,
    ): WorkspacesState =>
      getEntityNormalizedState(
        ToolName.Clockify,
        EntityGroup.Workspaces,
        schemaProcessStrategy,
        state,
        workspaces,
      ),

    [getType(workspacesActions.togglWorkspacesFetch.success)]: (
      state: WorkspacesState,
      { payload: workspaces }: ReduxAction<TogglWorkspace[]>,
    ): WorkspacesState =>
      getEntityNormalizedState(
        ToolName.Toggl,
        EntityGroup.Workspaces,
        schemaProcessStrategy,
        state,
        workspaces,
      ),

    [getType(workspacesActions.togglWorkspaceSummaryFetch.success)]: (
      state: WorkspacesState,
      {
        payload: { workspaceId, inclusionsByYear },
      }: ReduxAction<{
        workspaceId: string;
        inclusionsByYear: Record<string, boolean>;
      }>,
    ): WorkspacesState => {
      const workspacesById = cloneDeep(state.toggl.byId);
      const updatedWorkspacesById = Object.entries(workspacesById).reduce(
        (acc, [workspaceId, workspaceRecord]) => ({
          ...acc,
          [workspaceId]: {
            ...workspaceRecord,
            inclusionsByYear,
          },
        }),
        {},
      );

      return {
        ...state,
        toggl: {
          ...state.toggl,
          byId: updatedWorkspacesById,
        },
      };
    },

    [combineActions(
      getType(workspacesActions.clockifyWorkspacesFetch.request),
      getType(workspacesActions.togglWorkspacesFetch.request),
      getType(workspacesActions.clockifyWorkspaceTransfer.request),
      getType(workspacesActions.togglWorkspaceSummaryFetch.request),
    )]: (state: WorkspacesState): WorkspacesState => ({
      ...state,
      isFetching: true,
    }),

    [combineActions(
      getType(workspacesActions.clockifyWorkspacesFetch.success),
      getType(workspacesActions.clockifyWorkspacesFetch.failure),
      getType(workspacesActions.togglWorkspacesFetch.success),
      getType(workspacesActions.togglWorkspacesFetch.failure),
      getType(workspacesActions.togglWorkspaceSummaryFetch.success),
      getType(workspacesActions.togglWorkspaceSummaryFetch.failure),
      getType(workspacesActions.clockifyWorkspaceTransfer.success),
      getType(workspacesActions.clockifyWorkspaceTransfer.failure),
    )]: (state: WorkspacesState): WorkspacesState => ({
      ...state,
      isFetching: false,
    }),

    [getType(workspacesActions.appendUserIdsToWorkspace)]: (
      state: WorkspacesState,
      {
        payload: { toolName, workspaceId, userIds },
      }: ReduxAction<{
        toolName: ToolName;
        workspaceId: string;
        userIds: string[];
      }>,
    ): WorkspacesState => ({
      ...state,
      [toolName]: {
        ...state[toolName],
        byId: {
          ...state[toolName].byId,
          [workspaceId]: {
            ...state[toolName].byId[workspaceId],
            userIds: uniq([
              ...state[toolName].byId[workspaceId].userIds,
              ...userIds,
            ]),
          },
        },
      },
    }),

    [getType(workspacesActions.updateIsWorkspaceIncluded)]: (
      state: WorkspacesState,
      { payload: workspaceId }: ReduxAction<string>,
    ): WorkspacesState =>
      updateIsEntityIncluded(state, EntityType.Workspace, workspaceId),

    [getType(workspacesActions.updateIsWorkspaceYearIncluded)]: (
      state: WorkspacesState,
      {
        payload: { workspaceId, year },
      }: ReduxAction<{ workspaceId: string; year: number }>,
    ): WorkspacesState => {
      const inclusionsByYear = get(
        state,
        ['toggl', 'byId', workspaceId, 'inclusionsByYear'],
        {},
      );

      return {
        ...state,
        toggl: {
          ...state.toggl,
          byId: {
            ...state.toggl.byId,
            [workspaceId]: {
              ...state.toggl.byId[workspaceId],
              inclusionsByYear: {
                ...inclusionsByYear,
                [year]: !inclusionsByYear[year],
              },
            },
          },
        },
      };
    },

    [getType(workspacesActions.updateWorkspaceNameBeingFetched)]: (
      state: WorkspacesState,
      { payload: workspaceName }: ReduxAction<string>,
    ): WorkspacesState => ({
      ...state,
      workspaceNameBeingFetched: workspaceName,
    }),

    [getType(workspacesActions.updateFetchTimeByTool)]: (
      state: WorkspacesState,
      {
        payload: { toolName, fetchDate },
      }: ReduxAction<{ toolName: ToolName; fetchDate: Date | null }>,
    ): WorkspacesState => ({
      ...state,
      fetchTimesByTool: {
        ...state.fetchTimesByTool,
        [toolName]: fetchDate,
      },
    }),

    [getType(workspacesActions.resetContentsForTool)]: (
      state: WorkspacesState,
      { payload: toolName }: ReduxAction<string>,
    ): WorkspacesState => ({
      ...state,
      [toolName]: initialState[toolName],
    }),
  },
  initialState,
);