import React from "react";
import { connect } from "react-redux";
import { PayloadActionCreator } from "typesafe-actions";
import { flipIsClientIncluded } from "~/clients/clientsActions";
import {
  clientsForTableViewSelector,
  clientsTotalCountsByTypeSelector,
} from "~/clients/clientsSelectors";
import { EntityListPanel } from "~/components";
import { EntityGroup } from "~/allEntities/allEntitiesTypes";
import { ClientTableViewModel } from "~/clients/clientsTypes";
import { ReduxState } from "~/redux/reduxTypes";

interface ConnectStateProps {
  clients: ClientTableViewModel[];
  totalCountsByType: Record<string, number>;
}

interface ConnectDispatchProps {
  onFlipIsIncluded: PayloadActionCreator<string, string>;
}

type Props = ConnectStateProps & ConnectDispatchProps;

export const ClientsTableComponent: React.FC<Props> = props => (
  <EntityListPanel
    entityGroup={EntityGroup.Clients}
    rowNumber={2}
    tableData={props.clients}
    tableFields={[
      { label: "Name", field: "name" },
      { label: "Project Count", field: "projectCount" },
      { label: "Time Entry Count", field: "entryCount" },
    ]}
    totalCountsByType={props.totalCountsByType}
    onFlipIsIncluded={props.onFlipIsIncluded}
  />
);

const mapStateToProps = (state: ReduxState): ConnectStateProps => ({
  clients: clientsForTableViewSelector(state),
  totalCountsByType: clientsTotalCountsByTypeSelector(state),
});

const mapDispatchToProps: ConnectDispatchProps = {
  onFlipIsIncluded: flipIsClientIncluded,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ClientsTableComponent);
