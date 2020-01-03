import { SagaIterator } from "@redux-saga/types";
import { call } from "redux-saga/effects";
import { fetchArray, fetchObject } from "~/redux/sagaUtils";
import { sourceProjectsByIdSelector } from "~/projects/projectsSelectors";
import { EntityGroup, ToolName } from "~/allEntities/allEntitiesTypes";
import { createEntitiesForTool } from "~/redux/sagaUtils/createEntitiesForTool";
import { fetchEntitiesForTool } from "~/redux/sagaUtils/fetchEntitiesForTool";
import { findTargetEntityId } from "~/redux/sagaUtils/findTargetEntityId";
import { TaskModel } from "~/tasks/tasksTypes";

interface TogglTaskResponseModel {
  name: string;
  id: number;
  wid: number;
  pid: number;
  uid?: number;
  active: boolean;
  at: string;
  estimated_seconds: number;
}

/**
 * Creates new Toggl tasks that correspond to source and returns array of
 * transformed tasks.
 * @see https://github.com/toggl/toggl_api_docs/blob/master/chapters/tasks.md#create-a-task
 */
export function* createTogglTasksSaga(sourceTasks: TaskModel[]): SagaIterator {
  return yield call(createEntitiesForTool, {
    toolName: ToolName.Toggl,
    sourceRecords: sourceTasks,
    apiCreateFunc: createTogglTask,
  });
}

/**
 * Fetches all tasks in Toggl workspaces and returns the result.
 * @see https://github.com/toggl/toggl_api_docs/blob/master/chapters/workspaces.md#get-workspace-tasks
 */
export function* fetchTogglTasksSaga(): SagaIterator<TaskModel[]> {
  return yield call(fetchEntitiesForTool, {
    toolName: ToolName.Toggl,
    apiFetchFunc: fetchTogglTasksInWorkspace,
  });
}

function* createTogglTask(sourceTask: TaskModel): SagaIterator<TaskModel> {
  const targetProjectId = yield call(
    findTargetEntityId,
    sourceTask.projectId,
    sourceProjectsByIdSelector,
  );
  const taskRequest = {
    name: sourceTask.name,
    pid: +targetProjectId,
  };

  const { data } = yield call(fetchObject, "/toggl/api/tasks", {
    method: "POST",
    body: taskRequest,
  });

  return transformFromResponse(data);
}

function* fetchTogglTasksInWorkspace(
  workspaceId: string,
): SagaIterator<TaskModel[]> {
  const togglTasks: TogglTaskResponseModel[] = yield call(
    fetchArray,
    `/toggl/api/workspaces/${workspaceId}/tasks`,
  );

  return togglTasks.map(transformFromResponse);
}

function transformFromResponse(task: TogglTaskResponseModel): TaskModel {
  return {
    id: task.id.toString(),
    name: task.name,
    estimate: convertSecondsToClockifyEstimate(task.estimated_seconds),
    projectId: task.pid.toString(),
    assigneeIds: task.uid ? [task.uid.toString()] : [],
    isActive: task.active,
    workspaceId: task.wid.toString(),
    entryCount: 0,
    linkedId: null,
    isIncluded: true,
    memberOf: EntityGroup.Tasks,
  };
}

function convertSecondsToClockifyEstimate(seconds: number): string {
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `PT${minutes}M`;
  }

  const hours = minutes / 60;
  return `PT${hours}H`;
}
