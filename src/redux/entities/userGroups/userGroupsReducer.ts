import { getType } from 'typesafe-actions';
import { combineActions, handleActions } from 'redux-actions';
import { get, uniq } from 'lodash';
import * as utils from '~/redux/utils';
import * as userGroupsActions from './userGroupsActions';
import {
  ClockifyUserGroupModel,
  CompoundTimeEntryModel,
  CompoundUserGroupModel,
  CompoundUserModel,
  EntityGroup,
  EntityType,
  ReduxAction,
  ReduxStateEntryForTool,
  TogglUserGroupModel,
  ToolName,
} from '~/types';

export interface UserGroupsState {
  readonly clockify: ReduxStateEntryForTool<CompoundUserGroupModel>;
  readonly toggl: ReduxStateEntryForTool<CompoundUserGroupModel>;
  readonly isFetching: boolean;
}

export const initialState: UserGroupsState = {
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

const appendEntryCountToUserGroupsInState = (
  toolName: ToolName,
  state: UserGroupsState,
  timeEntries: Array<CompoundTimeEntryModel>,
  usersById: Record<string, CompoundUserModel>,
): UserGroupsState => {
  const userGroupsById = state[toolName].byId;

  const updatedUserGroupsById = Object.entries(userGroupsById).reduce(
    (userGroupsAcc, [userGroupId, userGroup]) => {
      let entryCount = 0;

      if (userGroup.userIds.length !== 0) {
        const entryCountByUserId = timeEntries.reduce(
          (timeEntryAcc, timeEntry) => {
            const userId = get(timeEntry, 'userId');
            if (!userId) return timeEntryAcc;

            return {
              ...timeEntryAcc,
              [userId]: get(timeEntryAcc, userId, 0) + 1,
            };
          },
          {},
        );

        userGroup.userIds.forEach(userId => {
          const matchingUser = get(usersById, userId);
          if (matchingUser) {
            entryCount += get(entryCountByUserId, userId, 0);
          }
        });
      }

      return {
        ...userGroupsAcc,
        [userGroupId]: { ...userGroup, entryCount },
      };
    },
    {},
  );

  return {
    ...state,
    [toolName]: {
      ...state[toolName],
      byId: updatedUserGroupsById,
    },
  };
};

export const userGroupsReducer = handleActions(
  {
    [combineActions(
      getType(userGroupsActions.clockifyUserGroupsFetch.success),
      getType(userGroupsActions.clockifyUserGroupsTransfer.success),
    )]: (
      state: UserGroupsState,
      { payload: userGroups }: ReduxAction<Array<ClockifyUserGroupModel>>,
    ): UserGroupsState => {
      const normalizedState = utils.normalizeState(
        ToolName.Clockify,
        EntityGroup.UserGroups,
        state,
        userGroups,
      );

      return utils.linkEntitiesInStateByName(
        EntityGroup.UserGroups,
        normalizedState,
      );
    },

    [getType(userGroupsActions.togglUserGroupsFetch.success)]: (
      state: UserGroupsState,
      { payload: userGroups }: ReduxAction<Array<TogglUserGroupModel>>,
    ): UserGroupsState =>
      utils.normalizeState(
        ToolName.Toggl,
        EntityGroup.UserGroups,
        state,
        userGroups,
      ),

    [combineActions(
      getType(userGroupsActions.clockifyUserGroupsFetch.request),
      getType(userGroupsActions.togglUserGroupsFetch.request),
      getType(userGroupsActions.clockifyUserGroupsTransfer.request),
    )]: (state: UserGroupsState): UserGroupsState => ({
      ...state,
      isFetching: true,
    }),

    [combineActions(
      getType(userGroupsActions.clockifyUserGroupsFetch.success),
      getType(userGroupsActions.clockifyUserGroupsFetch.failure),
      getType(userGroupsActions.togglUserGroupsFetch.success),
      getType(userGroupsActions.togglUserGroupsFetch.failure),
      getType(userGroupsActions.clockifyUserGroupsTransfer.success),
      getType(userGroupsActions.clockifyUserGroupsTransfer.failure),
    )]: (state: UserGroupsState): UserGroupsState => ({
      ...state,
      isFetching: false,
    }),

    [getType(userGroupsActions.flipIsUserGroupIncluded)]: (
      state: UserGroupsState,
      { payload: userGroupId }: ReduxAction<string>,
    ): UserGroupsState =>
      utils.flipEntityInclusion(state, EntityType.UserGroup, userGroupId),

    [getType(userGroupsActions.addTogglUserIdToGroup)]: (
      state: UserGroupsState,
      {
        payload: { userId, userGroupId },
      }: ReduxAction<{ userId: string; userGroupId: string }>,
    ): UserGroupsState => {
      const userGroup = get(state, ['toggl', 'byId', userGroupId]);
      if (!userGroup) return state;

      const newUserIds = uniq([...userGroup.userIds, userId]);
      return {
        ...state,
        toggl: {
          ...state.toggl,
          byId: {
            ...state.toggl.byId,
            [userGroupId]: {
              ...userGroup,
              userIds: newUserIds,
            },
          },
        },
      };
    },

    [getType(userGroupsActions.calculateUserGroupEntryCounts)]: (
      state: UserGroupsState,
      {
        payload: { toolName, timeEntries, usersById },
      }: ReduxAction<userGroupsActions.EntryCountCalculatorModel>,
    ) =>
      appendEntryCountToUserGroupsInState(
        toolName,
        state,
        timeEntries,
        usersById,
      ),
  },
  initialState,
);
