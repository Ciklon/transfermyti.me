import { createSelector } from 'reselect';
import { get, isEmpty, isNil } from 'lodash';
import { selectTogglClientsByWorkspaceFactory } from '~/redux/entities/clients/clientsSelectors';
import { selectTogglProjectsByWorkspaceFactory } from '~/redux/entities/projects/projectsSelectors';
import { selectTogglTagsByWorkspaceFactory } from '~/redux/entities/tags/tagsSelectors';
import { selectToggleTasksByWorkspaceFactory } from '~/redux/entities/tasks/tasksSelectors';
import { selectTimeEntriesByWorkspaceFactory } from '~/redux/entities/timeEntries/timeEntriesSelectors';
import { selectTogglUserGroupsByWorkspaceFactory } from '~/redux/entities/userGroups/userGroupsSelectors';
import { selectTogglUsersByWorkspaceFactory } from '~/redux/entities/users/usersSelectors';
import {
  CompoundEntityModel,
  CompoundWorkspaceModel,
  CountsByGroupByWorkspaceModel,
  EntitiesByGroupByWorkspaceModel,
  EntityGroup,
  RecordCountsModel,
  ReduxState,
  ToolName,
} from '~/types';

export const selectTogglWorkspaceIds = createSelector(
  (state: ReduxState) => state.entities.workspaces.toggl.idValues,
  (workspaceIds): Array<string> => workspaceIds,
);

const selectClockifyWorkspacesById = createSelector(
  (state: ReduxState) => state.entities.workspaces.clockify.byId,
  (workspacesById): Record<string, CompoundWorkspaceModel> => workspacesById,
);

export const selectTogglWorkspacesById = createSelector(
  (state: ReduxState) => state.entities.workspaces.toggl.byId,
  (workspacesById): Record<string, CompoundWorkspaceModel> => workspacesById,
);

export const selectTogglIncludedWorkspacesById = createSelector(
  selectTogglWorkspacesById,
  (workspacesById): Record<string, CompoundWorkspaceModel> =>
    Object.entries(workspacesById).reduce(
      (acc, [workspaceId, workspaceRecord]) => {
        if (!workspaceRecord.isIncluded) return acc;
        return {
          ...acc,
          [workspaceId]: workspaceRecord,
        };
      },
      {},
    ),
);

export const selectTogglIncludedWorkspaces = createSelector(
  selectTogglIncludedWorkspacesById,
  (workspacesById): Array<CompoundWorkspaceModel> =>
    Object.values(workspacesById),
);

const selectTogglIncludedWorkspacesByName = createSelector(
  selectTogglIncludedWorkspaces,
  (includedWorkspaces): Record<string, CompoundWorkspaceModel> =>
    includedWorkspaces.reduce(
      (acc, workspace) => ({
        ...acc,
        [workspace.name]: workspace,
      }),
      {},
    ),
);

export const selectTogglIncludedWorkspaceNames = createSelector(
  selectTogglIncludedWorkspacesByName,
  (workspacesByName): Array<string> => Object.keys(workspacesByName),
);

export const selectClockifyIncludedWorkspacesById = createSelector(
  selectClockifyWorkspacesById,
  selectTogglIncludedWorkspacesByName,
  (clockifyWorkspacesById, togglWorkspacesByName) =>
    Object.entries(clockifyWorkspacesById).reduce(
      (acc, [workspaceId, workspaceRecord]) => {
        if (isNil(togglWorkspacesByName[workspaceRecord.name])) return acc;
        return {
          ...acc,
          [workspaceId]: workspaceRecord,
        };
      },
      {},
    ),
);

export const selectTogglIncludedWorkspacesCount = createSelector(
  selectTogglIncludedWorkspaces,
  (workspaces): number => workspaces.length,
);

export const selectTogglWorkspaceIncludedYears = createSelector(
  selectTogglWorkspacesById,
  selectClockifyWorkspacesById,
  (_: any, clockifyWorkspaceId: string) => clockifyWorkspaceId,
  (
    togglWorkspacesById,
    clockifyWorkspacesById,
    clockifyWorkspaceId,
  ): Array<number> => {
    const { linkedId } = get(clockifyWorkspacesById, clockifyWorkspaceId, {
      linkedId: null,
    });
    if (isNil(linkedId)) return [];

    const { inclusionsByYear } = get(togglWorkspacesById, linkedId, {
      inclusionsByYear: null,
    });
    if (isNil(inclusionsByYear)) return [];

    return Object.entries(inclusionsByYear).reduce(
      (acc, [year, isIncluded]) => {
        if (!isIncluded) return acc;
        return [...acc, year];
      },
      [],
    );
  },
);

export const selectTogglWorkspaceIncludedYearsCount = createSelector(
  selectTogglWorkspacesById,
  (workspacesById): Record<string, number> =>
    Object.entries(workspacesById).reduce(
      (acc, [workspaceId, { inclusionsByYear }]) => {
        const includedYears = Object.values(inclusionsByYear).filter(Boolean);
        return {
          ...acc,
          [workspaceId]: includedYears.length,
        };
      },
      {},
    ),
);

export const selectIfTogglWorkspaceYearsFetched = createSelector(
  selectTogglWorkspacesById,
  selectTogglWorkspaceIds,
  (workspacesById, workspaceIds): boolean => {
    if (isEmpty(workspacesById)) return false;

    const hasYearInclusionsCount = Object.values(workspacesById).reduce(
      (acc, { inclusionsByYear }) => acc + (isEmpty(inclusionsByYear) ? 0 : 1),
      0,
    );
    return hasYearInclusionsCount === workspaceIds.length;
  },
);

export const selectWorkspaceNameBeingFetched = createSelector(
  (state: ReduxState) => state.entities.workspaces.workspaceNameBeingFetched,
  (workspaceNameBeingFetched): string => workspaceNameBeingFetched,
);

export const selectTogglEntitiesByGroupByWorkspace = createSelector(
  selectTogglEntitiesByGroupByWorkspaceFactory(false),
  togglAllEntitiesByGroupByWorkspace => togglAllEntitiesByGroupByWorkspace,
);

export const selectTogglCountsByGroupByWorkspace = createSelector(
  selectTogglEntitiesByGroupByWorkspaceFactory(false),
  (entitiesByGroupByWorkspace): CountsByGroupByWorkspaceModel =>
    Object.entries(entitiesByGroupByWorkspace).reduce(
      (acc, [workspaceId, entitiesByGroup]) => ({
        ...acc,
        [workspaceId]: calculateRecordCountsByEntityGroup(entitiesByGroup),
      }),
      {},
    ),
);

function selectTogglEntitiesByGroupByWorkspaceFactory(inclusionsOnly: boolean) {
  return createSelector(
    selectTogglWorkspaceIds,
    selectTogglClientsByWorkspaceFactory(inclusionsOnly),
    selectTogglProjectsByWorkspaceFactory(inclusionsOnly),
    selectTogglTagsByWorkspaceFactory(inclusionsOnly),
    selectToggleTasksByWorkspaceFactory(inclusionsOnly),
    selectTimeEntriesByWorkspaceFactory(ToolName.Toggl, inclusionsOnly),
    selectTogglUserGroupsByWorkspaceFactory(inclusionsOnly),
    selectTogglUsersByWorkspaceFactory(inclusionsOnly),
    (
      workspaceIds: Array<string>,
      clientsByWorkspace: Record<string, Array<CompoundEntityModel>>,
      projectsByWorkspace: Record<string, Array<CompoundEntityModel>>,
      tagsByWorkspace: Record<string, Array<CompoundEntityModel>>,
      tasksByWorkspace: Record<string, Array<CompoundEntityModel>>,
      timeEntriesByWorkspace: Record<string, Array<CompoundEntityModel>>,
      userGroupsByWorkspace: Record<string, Array<CompoundEntityModel>>,
      usersByWorkspace: Record<string, Array<CompoundEntityModel>>,
    ): EntitiesByGroupByWorkspaceModel =>
      workspaceIds.reduce(
        (acc, workspaceId) => ({
          ...acc,
          [workspaceId.toString()]: {
            [EntityGroup.Clients]: get(clientsByWorkspace, workspaceId, []),
            [EntityGroup.Projects]: get(projectsByWorkspace, workspaceId, []),
            [EntityGroup.Tags]: get(tagsByWorkspace, workspaceId, []),
            [EntityGroup.Tasks]: get(tasksByWorkspace, workspaceId, []),
            [EntityGroup.TimeEntries]: get(
              timeEntriesByWorkspace,
              workspaceId,
              [],
            ),
            [EntityGroup.UserGroups]: get(
              userGroupsByWorkspace,
              workspaceId,
              [],
            ),
            [EntityGroup.Users]: get(usersByWorkspace, workspaceId, []),
          },
        }),
        {},
      ),
  );
}

function calculateRecordCountsByEntityGroup(
  entitiesByGroup: Record<EntityGroup, Array<CompoundEntityModel>>,
): Record<EntityGroup, RecordCountsModel> {
  const totalEntryCount = entitiesByGroup[EntityGroup.TimeEntries].length;

  return Object.entries(entitiesByGroup).reduce(
    (acc, [entityGroup, entityRecords]) => {
      const totalRecordCount = entityRecords.length;
      let includedRecordCount = 0;
      let includedEntryCount = 0;

      entityRecords.forEach(entityRecord => {
        if (entityRecord.isIncluded && isNil(entityRecord.linkedId)) {
          includedRecordCount += 1;
          includedEntryCount += get(entityRecord, 'entryCount', 0);
        }
      });

      return {
        ...acc,
        [entityGroup]: {
          includedRecordCount,
          totalRecordCount,
          includedEntryCount,
          totalEntryCount,
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
    {} as Record<EntityGroup, RecordCountsModel>,
  );
}
