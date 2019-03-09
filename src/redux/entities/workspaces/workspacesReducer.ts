import { handleActions, combineActions } from 'redux-actions';
import { cloneDeep, get, uniq } from 'lodash';
import {
  getEntityNormalizedState,
  updateIsEntityIncluded,
} from '~/redux/utils';
import {
  clockifyWorkspacesFetchStarted,
  clockifyWorkspacesFetchSuccess,
  clockifyWorkspacesFetchFailure,
  togglWorkspacesFetchStarted,
  togglWorkspacesFetchSuccess,
  togglWorkspacesFetchFailure,
  togglWorkspaceSummaryFetchStarted,
  togglWorkspaceSummaryFetchSuccess,
  togglWorkspaceSummaryFetchFailure,
  clockifyWorkspaceTransferStarted,
  clockifyWorkspaceTransferSuccess,
  clockifyWorkspaceTransferFailure,
  appendUserIdsToWorkspace,
  updateIsWorkspaceIncluded,
  updateIsWorkspaceYearIncluded,
  updateWorkspaceNameBeingFetched,
  updateFetchTimeByTool,
  resetContentsForTool,
} from './workspacesActions';
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
      clockifyWorkspacesFetchSuccess,
      clockifyWorkspaceTransferSuccess,
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

    [togglWorkspacesFetchSuccess]: (
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

    [togglWorkspaceSummaryFetchSuccess]: (
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
      clockifyWorkspacesFetchStarted,
      togglWorkspacesFetchStarted,
      clockifyWorkspaceTransferStarted,
      togglWorkspaceSummaryFetchStarted,
    )]: (state: WorkspacesState): WorkspacesState => ({
      ...state,
      isFetching: true,
    }),

    [combineActions(
      clockifyWorkspacesFetchSuccess,
      clockifyWorkspacesFetchFailure,
      togglWorkspacesFetchSuccess,
      togglWorkspacesFetchFailure,
      togglWorkspaceSummaryFetchSuccess,
      togglWorkspaceSummaryFetchFailure,
      clockifyWorkspaceTransferSuccess,
      clockifyWorkspaceTransferFailure,
    )]: (state: WorkspacesState): WorkspacesState => ({
      ...state,
      isFetching: false,
    }),

    [appendUserIdsToWorkspace]: (
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

    [updateIsWorkspaceIncluded]: (
      state: WorkspacesState,
      { payload: workspaceId }: ReduxAction<string>,
    ): WorkspacesState =>
      updateIsEntityIncluded(state, EntityType.Workspace, workspaceId),

    [updateIsWorkspaceYearIncluded]: (
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

    [updateWorkspaceNameBeingFetched]: (
      state: WorkspacesState,
      { payload: workspaceName }: ReduxAction<string>,
    ): WorkspacesState => ({
      ...state,
      workspaceNameBeingFetched: workspaceName,
    }),

    [updateFetchTimeByTool]: (
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

    [resetContentsForTool]: (
      state: WorkspacesState,
      { payload: toolName }: ReduxAction<string>,
    ): WorkspacesState => ({
      ...state,
      [toolName]: initialState[toolName],
    }),
  },
  initialState,
);
