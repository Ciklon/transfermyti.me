import { push } from "connected-react-router";
import { Path } from "history";
import React from "react";
import { connect } from "react-redux";
import { PayloadActionCreator } from "typesafe-actions";
import {
  fetchAllEntities,
  updateFetchAllFetchStatus,
} from "~/allEntities/allEntitiesActions";
import { dismissAllNotifications, showNotification } from "~/app/appActions";
import {
  fetchWorkspaces,
  flipIsWorkspaceIncluded,
} from "~/workspaces/workspacesActions";
import {
  areWorkspacesFetchingSelector,
  sourceIncludedWorkspacesCountSelector,
  sourceWorkspacesSelector,
} from "~/workspaces/workspacesSelectors";
import {
  Button,
  Flex,
  HelpDetails,
  Loader,
  NavigationButtonsRow,
  Note,
} from "~/components";
import NoWorkspacesModal from "./NoWorkspacesModal";
import SourceWorkspaceCard from "./SourceWorkspaceCard";
import {
  FetchStatus,
  NotificationModel,
  ReduxState,
  RoutePath,
  WorkspaceModel,
} from "~/typeDefs";

interface ConnectStateProps {
  areWorkspacesFetching: boolean;
  includedWorkspacesCount: number;
  workspaces: WorkspaceModel[];
}

interface ConnectDispatchProps {
  onDismissAllNotifications: VoidFunction;
  onFetchAllEntities: PayloadActionCreator<string, void>;
  onFetchWorkspaces: PayloadActionCreator<string, void>;
  onFlipIsWorkspaceIncluded: (workspace: WorkspaceModel) => void;
  onPush: (path: Path) => void;
  onShowNotification: (notification: Partial<NotificationModel>) => void;
  onUpdateFetchAllFetchStatus: PayloadActionCreator<string, FetchStatus>;
}

type Props = ConnectStateProps & ConnectDispatchProps;

export const SelectSourceWorkspacesStepComponent: React.FC<Props> = props => {
  const [isErrorModalOpen, setIsErrorModalOpen] = React.useState<boolean>(
    false,
  );

  React.useEffect(() => {
    if (props.workspaces.length === 0) {
      props.onFetchWorkspaces();
    }
  }, []);

  const handleBackClick = (): void => {
    props.onPush(RoutePath.EnterApiKeys);
  };

  const handleNextClick = (): void => {
    if (props.includedWorkspacesCount === 0) {
      setIsErrorModalOpen(true);
      return;
    }

    props.onUpdateFetchAllFetchStatus(FetchStatus.Pending);
    props.onPush(RoutePath.SelectInclusions);
  };

  return (
    <section>
      <h1>Step 3: Select Workspaces</h1>
      <HelpDetails>
        <p>
          Select which workspaces you would like to include in the
          deletion/transfer and press the <strong>Next</strong> button to move
          on to the inclusions selection step.
        </p>
        <p>
          If you decide you want to include additional workspaces, you&apos;ll
          need to come back to this page and select them, otherwise the
          corresponding data won&apos;t be fetched.
        </p>
        <Note>
          Only select the workspaces containing data you wish to update. The
          fetch process can take several minutes depending on the amount of data
          in each workspace.
        </Note>
      </HelpDetails>
      {props.areWorkspacesFetching ? (
        <Loader>Loading workspaces, please wait...</Loader>
      ) : (
        <Flex as="ul" css={{ listStyle: "none", padding: 0 }}>
          {props.workspaces.map(workspace => (
            <SourceWorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onToggleIncluded={props.onFlipIsWorkspaceIncluded}
            />
          ))}
        </Flex>
      )}
      <NavigationButtonsRow
        css={{ marginTop: 0 }}
        disabled={props.areWorkspacesFetching}
        onBackClick={handleBackClick}
        onNextClick={handleNextClick}
      >
        <Button
          variant="outlinePrimary"
          disabled={props.areWorkspacesFetching}
          onClick={() => props.onFetchWorkspaces()}
        >
          Refresh
        </Button>
      </NavigationButtonsRow>
      <NoWorkspacesModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
      />
    </section>
  );
};

const mapStateToProps = (state: ReduxState): ConnectStateProps => ({
  areWorkspacesFetching: areWorkspacesFetchingSelector(state),
  includedWorkspacesCount: sourceIncludedWorkspacesCountSelector(state),
  workspaces: sourceWorkspacesSelector(state),
});

const mapDispatchToProps: ConnectDispatchProps = {
  onDismissAllNotifications: dismissAllNotifications,
  onFetchAllEntities: fetchAllEntities.request,
  onFetchWorkspaces: fetchWorkspaces.request,
  onFlipIsWorkspaceIncluded: flipIsWorkspaceIncluded,
  onPush: push,
  onShowNotification: showNotification,
  onUpdateFetchAllFetchStatus: updateFetchAllFetchStatus,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SelectSourceWorkspacesStepComponent);
