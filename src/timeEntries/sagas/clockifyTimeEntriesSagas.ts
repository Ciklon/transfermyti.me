import * as R from "ramda";
import { call, select } from "redux-saga/effects";
import { SagaIterator } from "@redux-saga/types";
import {
  createEntitiesForTool,
  fetchEntitiesForTool,
  fetchObject,
  findTargetEntityId,
  paginatedClockifyFetch,
} from "~/redux/sagaUtils";
import { credentialsSelector } from "~/credentials/credentialsSelectors";
import { sourceProjectsByIdSelector } from "~/projects/projectsSelectors";
import { targetTagIdsSelectorFactory } from "~/tags/tagsSelectors";
import { sourceTasksByIdSelector } from "~/tasks/tasksSelectors";
import { ClockifyProjectResponseModel } from "~/projects/sagas/clockifyProjectsSagas";
import { ClockifyTagResponseModel } from "~/tags/sagas/clockifyTagsSagas";
import { ClockifyTaskResponseModel } from "~/tasks/sagas/clockifyTasksSagas";
import { ClockifyUserResponseModel } from "~/users/sagas/clockifyUsersSagas";
import { EntityGroup, ToolName } from "~/allEntities/allEntitiesTypes";
import { TimeEntryModel } from "~/timeEntries/timeEntriesTypes";

interface ClockifyTimeIntervalModel {
  duration: string;
  end: string;
  start: string;
}

interface ClockifyTimeEntryResponseModel {
  billable: boolean;
  description: string;
  hourlyRate: { amount: number; currency: string };
  id: string;
  isLocked: boolean;
  project: ClockifyProjectResponseModel;
  projectId: string;
  tags: ClockifyTagResponseModel[];
  task: ClockifyTaskResponseModel;
  timeInterval: ClockifyTimeIntervalModel;
  totalBillable: number | null;
  user: ClockifyUserResponseModel;
  workspaceId: string;
}

/**
 * Creates Clockify time entries in all workspaces and returns array of
 * transformed time entries.
 * @see https://clockify.me/developers-api#operation--v1-workspaces--workspaceId--timeEntries-post
 */
export function* createClockifyTimeEntriesSaga(
  sourceTimeEntries: TimeEntryModel[],
): SagaIterator<TimeEntryModel[]> {
  return yield call(createEntitiesForTool, {
    toolName: ToolName.Clockify,
    sourceRecords: sourceTimeEntries,
    apiCreateFunc: createClockifyTimeEntry,
  });
}

/**
 * Fetches all time entries in Clockify workspaces and returns array of
 * transformed time entries.
 * @see https://clockify.me/developers-api#operation--v1-workspaces--workspaceId--timeEntries-get
 */
export function* fetchClockifyTimeEntriesSaga(): SagaIterator<
  TimeEntryModel[]
> {
  return yield call(fetchEntitiesForTool, {
    toolName: ToolName.Clockify,
    apiFetchFunc: fetchClockifyTimeEntriesInWorkspace,
  });
}

function* createClockifyTimeEntry(
  sourceTimeEntry: TimeEntryModel,
  targetWorkspaceId: string,
): SagaIterator<TimeEntryModel> {
  const targetProjectId = yield call(
    findTargetEntityId,
    sourceTimeEntry.projectId,
    sourceProjectsByIdSelector,
  );
  const targetTagIds = yield select(
    targetTagIdsSelectorFactory(sourceTimeEntry.tagIds),
  );
  const targetTaskId = yield call(
    findTargetEntityId,
    sourceTimeEntry.taskId,
    sourceTasksByIdSelector,
  );
  const timeEntryRequest = {
    start: sourceTimeEntry.start,
    billable: sourceTimeEntry.isBillable,
    description: sourceTimeEntry.description,
    projectId: targetProjectId ?? undefined,
    taskId: targetTaskId ?? undefined,
    end: sourceTimeEntry.end,
    tagIds: targetTagIds.length !== 0 ? targetTagIds : undefined,
  };

  const targetTimeEntry = yield call(
    fetchObject,
    `/clockify/api/v1/workspaces/${targetWorkspaceId}/time-entries`,
    {
      method: "POST",
      body: timeEntryRequest,
    },
  );

  return transformFromResponse(targetTimeEntry);
}

function* fetchClockifyTimeEntriesInWorkspace(
  workspaceId: string,
): SagaIterator<TimeEntryModel[]> {
  const { clockifyUserId } = yield select(credentialsSelector);
  const clockifyTimeEntries: ClockifyTimeEntryResponseModel[] = yield call(
    paginatedClockifyFetch,
    `/clockify/api/v1/workspaces/${workspaceId}/user/${clockifyUserId}/time-entries`,
  );

  return clockifyTimeEntries.map(transformFromResponse);
}

function transformFromResponse(
  timeEntry: ClockifyTimeEntryResponseModel,
): TimeEntryModel {
  const startTime = getTime(timeEntry, "start");
  const tags = R.pathOr([], ["tags"], timeEntry);

  return {
    id: timeEntry.id,
    description: timeEntry.description,
    isBillable: timeEntry.billable,
    start: startTime,
    end: getTime(timeEntry, "end"),
    year: startTime.getFullYear(),
    isActive: false,
    clientId: "",
    projectId: timeEntry.project.id,
    tagIds: tags.map(({ id }: ClockifyTagResponseModel) => id),
    tagNames: tags.map(({ name }: ClockifyTagResponseModel) => name),
    taskId: timeEntry?.task?.id ?? null,
    userId: timeEntry?.user?.id ?? null,
    userGroupIds: [],
    workspaceId: timeEntry.workspaceId,
    entryCount: 0,
    linkedId: null,
    isIncluded: true,
    memberOf: EntityGroup.TimeEntries,
  };
}

function getTime(
  timeEntry: ClockifyTimeEntryResponseModel,
  field: "start" | "end",
): Date {
  const value = R.pathOr(null, ["timeInterval", field], timeEntry);
  return R.isNil(value) ? new Date() : new Date(value);
}
