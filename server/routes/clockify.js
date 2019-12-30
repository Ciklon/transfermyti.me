const path = require("path");
const fse = require("fs-extra");
const { isSameYear } = require("date-fns");
const { find, get, uniqueId } = require("lodash");

const dbPath = path.resolve(__dirname, "..", "db", "clockify.json");
const db = fse.readJSONSync(dbPath);

const isEmpty = process.env.LOCAL_API_CLOCKIFY_EMPTY;

function assignClockifyRoutes(router) {
  let entriesCreated = 20;

  router
    .get("/v1/user", (req, res) => {
      const [firstUser] = db.users;
      res.status(200).send(firstUser);
    })
    .get("/v1/workspaces/:workspaceId/clients", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.clients),
    )
    .get("/v1/workspaces/:workspaceId/projects", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.projects),
    )
    .get("/workspaces/:workspaceId/projects/:projectId/users/", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.users),
    )
    .get("/v1/workspaces/:workspaceId/tags", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.tags),
    )
    .get("/v1/workspaces/:workspaceId/projects/:projectId/tasks", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.tasks),
    )
    .get(
      "/v1/workspaces/:workspaceId/user/:userId/time-entries",
      (req, res) => {
        // TODO: Add additional records to use query params.
        // const page = req.query.page;
        // const pageSize = req.query["page-size"];

        // TODO: Add accomodations for hydrated = true (changes tag, task, and
        //       project IDs to the tag, task, and project record).

        res.status(200).send(db.timeEntries);
      },
    )
    .get("/workspaces/:workspaceId/userGroups/", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.userGroups),
    )
    .get("/v1/workspaces/:workspaceId/users", (req, res) =>
      res.status(200).send(isEmpty === true ? [] : db.users),
    )
    .get("/v1/workspaces", (req, res) => res.status(200).send(db.workspaces));

  router
    .post("/v1/workspaces/:workspaceId/clients", (req, res) => {
      const newClient = {
        id: uniqueId("clock-client-0"),
        name: req.body.name,
        workspace: req.params.workspaceId,
      };

      res.status(200).send(newClient);
    })
    .post("/v1/workspaces/:workspaceId/projects", (req, res) => {
      const newProject = {
        id: uniqueId("clock-client-0"),
        name: req.body.name,
        hourlyRate: {
          amount: 0,
          currency: "USD",
        },
        estimate: req.body.estimate,
        color: req.body.color,
        workspaceId: req.params.workspaceId,
        memberships: get(db.users, ["clock-user-01", "memberships"], []),
        archived: false,
        duration: "PT0S",
        clientName: get(db.clients, [req.body.clientId, "name"], null),
        public: req.body.isPublic,
        billable: req.body.billable,
      };

      res.status(200).send(newProject);
    })
    .post("/v1/workspaces/:workspaceId/tags", (req, res) => {
      const newTag = {
        id: uniqueId("clock-tag-0"),
        name: req.body.name,
        workspace: req.params.workspaceId,
      };

      res.status(200).send(newTag);
    })
    .post("/v1/workspaces/:workspaceId/tasks", (req, res) => {
      const newTask = {
        id: uniqueId("clock-task-0"),
        name: req.body.name,
        workspace: req.params.workspaceId,
      };

      res.status(200).send(newTask);
    })
    .post("/v1/workspaces/:workspaceId/time-entries", (req, res) => {
      const [firstUser] = db.users;
      entriesCreated += 1;

      const newTimeEntry = {
        id: "clock-entry-".concat(entriesCreated.toString()),
        billable: req.body.billable,
        description: req.body.description,
        projectId: req.body.projectId,
        tagIds: req.body.tagIds,
        userId: firstUser.id,
        workspaceId: req.body.workspaceId,
        isLocked: false,
        timeInterval: {
          start: req.body.start,
          end: req.body.end,
          duration: "",
        },
      };

      res.status(200).send(newTimeEntry);
    })
    .post("/workspaces/:workspaceId/userGroups/", (req, res) => {
      const newUserGroup = {
        id: uniqueId("clock-user-group-0"),
        name: req.body.name,
        workspace: req.params.workspaceId,
        userIds: [],
      };

      res.status(200).send(newUserGroup);
    })
    .post("/workspaces/:workspaceId/users", (req, res) => {
      const workspace = get(db.workspaces, req.params.workspaceId, {});
      res.status(200).send(workspace);
    })
    .post("/v1/workspaces", (req, res) => {
      const [firstWorkspace] = db.workspaces;
      const newWorkspace = {
        ...firstWorkspace,
        id: uniqueId("clock-workspace-0"),
        name: req.body.name,
      };

      res.status(200).send(newWorkspace);
    });
}

module.exports = { assignClockifyRoutes };
