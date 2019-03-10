import { getType } from 'typesafe-actions';
import { combineActions, handleActions } from 'redux-actions';
import {
  getEntityIdFieldValue,
  getEntityNormalizedState,
  updateIsEntityIncluded,
} from '~/redux/utils';
import * as clientsActions from './clientsActions';
import { ClientModel, ClockifyClient, TogglClient } from '~/types/clientsTypes';
import {
  EntityGroup,
  EntityType,
  ReduxAction,
  ReduxStateEntryForTool,
  ToolName,
} from '~/types/commonTypes';

export interface ClientsState {
  readonly clockify: ReduxStateEntryForTool<ClientModel>;
  readonly toggl: ReduxStateEntryForTool<ClientModel>;
  readonly isFetching: boolean;
}

export const initialState: ClientsState = {
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
  value: ClockifyClient | TogglClient,
): ClientModel => ({
  id: value.id.toString(),
  name: value.name,
  workspaceId: getEntityIdFieldValue(value, EntityType.Workspace),
  entryCount: 0,
  linkedId: null,
  isIncluded: true,
});

export default handleActions(
  {
    [combineActions(
      getType(clientsActions.clockifyClientsFetch.success),
      getType(clientsActions.clockifyClientsTransfer.success),
    )]: (
      state: ClientsState,
      { payload: clients }: ReduxAction<ClockifyClient[]>,
    ): ClientsState =>
      getEntityNormalizedState(
        ToolName.Clockify,
        EntityGroup.Clients,
        schemaProcessStrategy,
        state,
        clients,
      ),

    [getType(clientsActions.togglClientsFetch.success)]: (
      state: ClientsState,
      { payload: clients }: ReduxAction<TogglClient[]>,
    ): ClientsState =>
      getEntityNormalizedState(
        ToolName.Toggl,
        EntityGroup.Clients,
        schemaProcessStrategy,
        state,
        clients,
      ),

    [combineActions(
      getType(clientsActions.clockifyClientsFetch.request),
      getType(clientsActions.togglClientsFetch.request),
      getType(clientsActions.clockifyClientsTransfer.request),
    )]: (state: ClientsState): ClientsState => ({
      ...state,
      isFetching: true,
    }),

    [combineActions(
      getType(clientsActions.clockifyClientsFetch.success),
      getType(clientsActions.clockifyClientsFetch.failure),
      getType(clientsActions.togglClientsFetch.success),
      getType(clientsActions.togglClientsFetch.failure),
      getType(clientsActions.clockifyClientsTransfer.success),
      getType(clientsActions.clockifyClientsTransfer.failure),
    )]: (state: ClientsState): ClientsState => ({
      ...state,
      isFetching: false,
    }),

    [getType(clientsActions.updateIsClientIncluded)]: (
      state: ClientsState,
      { payload: clientId }: ReduxAction<string>,
    ): ClientsState =>
      updateIsEntityIncluded(state, EntityType.Client, clientId),
  },
  initialState,
);