import { getType } from 'typesafe-actions';
import { combineActions, handleActions } from 'redux-actions';
import { get } from 'lodash';
import {
  getEntityIdFieldValue,
  getEntityNormalizedState,
  updateIsEntityIncluded,
} from '~/redux/utils';
import * as projectsActions from './projectsActions';
import {
  EntityGroup,
  EntityType,
  ReduxAction,
  ReduxStateEntryForTool,
  ToolName,
} from '~/types/commonTypes';
import {
  ClockifyProject,
  ProjectModel,
  TogglProject,
} from '~/types/projectsTypes';

export interface ProjectsState {
  readonly clockify: ReduxStateEntryForTool<ProjectModel>;
  readonly toggl: ReduxStateEntryForTool<ProjectModel>;
  readonly isFetching: boolean;
}

export const initialState: ProjectsState = {
  clockify: {
    byId: {},
    idValues: [],
  },
  toggl: {
    byId: {},
    idValues: [],
  },
  isFetching: false,
};

const schemaProcessStrategy = (
  value: ClockifyProject | TogglProject,
): ProjectModel => ({
  id: value.id.toString(),
  name: value.name,
  workspaceId: getEntityIdFieldValue(value, EntityType.Workspace),
  clientId: getEntityIdFieldValue(value, EntityType.Client),
  isBillable: value.billable,
  isPublic: 'public' in value ? value.public : !value.is_private,
  isActive: 'archived' in value ? value.archived : value.active,
  color: 'hex_color' in value ? value.hex_color : value.color,
  userIds: get(value, 'userIds', []).map((userId: number) => userId.toString()),
  entryCount: 0,
  linkedId: null,
  isIncluded: true,
});

export default handleActions(
  {
    [combineActions(
      getType(projectsActions.clockifyProjectsFetch.success),
      getType(projectsActions.clockifyProjectsTransfer.success),
    )]: (
      state: ProjectsState,
      { payload: projects }: ReduxAction<ClockifyProject[]>,
    ): ProjectsState =>
      getEntityNormalizedState(
        ToolName.Clockify,
        EntityGroup.Projects,
        schemaProcessStrategy,
        state,
        projects,
      ),

    [getType(projectsActions.togglProjectsFetch.success)]: (
      state: ProjectsState,
      { payload: projects }: ReduxAction<TogglProject[]>,
    ): ProjectsState =>
      getEntityNormalizedState(
        ToolName.Toggl,
        EntityGroup.Projects,
        schemaProcessStrategy,
        state,
        projects,
      ),

    [combineActions(
      getType(projectsActions.clockifyProjectsFetch.request),
      getType(projectsActions.togglProjectsFetch.request),
      getType(projectsActions.clockifyProjectsTransfer.request),
    )]: (state: ProjectsState): ProjectsState => ({
      ...state,
      isFetching: true,
    }),

    [combineActions(
      getType(projectsActions.clockifyProjectsFetch.success),
      getType(projectsActions.clockifyProjectsFetch.failure),
      getType(projectsActions.togglProjectsFetch.success),
      getType(projectsActions.togglProjectsFetch.failure),
      getType(projectsActions.clockifyProjectsTransfer.success),
      getType(projectsActions.clockifyProjectsTransfer.failure),
    )]: (state: ProjectsState): ProjectsState => ({
      ...state,
      isFetching: false,
    }),

    [getType(projectsActions.updateIsProjectIncluded)]: (
      state: ProjectsState,
      { payload: projectId }: ReduxAction<string>,
    ): ProjectsState =>
      updateIsEntityIncluded(state, EntityType.Project, projectId),
  },
  initialState,
);
