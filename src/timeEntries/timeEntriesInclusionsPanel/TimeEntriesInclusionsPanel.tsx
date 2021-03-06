import React from "react";
import { connect } from "react-redux";
import { PayloadActionCreator } from "typesafe-actions";
import {
  replaceMappingWithToolNameSelector,
  toolActionSelector,
} from "~/allEntities/allEntitiesSelectors";
import {
  flipIsTimeEntryIncluded,
  updateAreAllTimeEntriesIncluded,
} from "~/timeEntries/timeEntriesActions";
import {
  timeEntriesForInclusionsTableSelector,
  timeEntriesTotalCountsByTypeSelector,
} from "~/timeEntries/timeEntriesSelectors";
import {
  AccordionPanel,
  InclusionsTableTitle,
  NoRecordsFound,
} from "~/components";
import TimeEntriesInclusionsTable from "./TimeEntriesInclusionsTable";
import TimeEntryComparisonDisclaimer from "./TimeEntryComparisonDisclaimer";
import { ReduxState, TimeEntryTableViewModel, ToolAction } from "~/typeDefs";

// TODO: Add a form that allows the user to specify which criteria should be
//       used to detect duplicate time entries.

interface ConnectStateProps {
  replaceMappingWithToolName: (label: string) => string;
  timeEntries: TimeEntryTableViewModel[];
  toolAction: ToolAction;
  totalCountsByType: Record<string, number>;
}

interface ConnectDispatchProps {
  onFlipIsIncluded: PayloadActionCreator<string, string>;
  onUpdateAreAllIncluded: PayloadActionCreator<string, boolean>;
}

type Props = ConnectStateProps & ConnectDispatchProps;

export const TimeEntriesInclusionsPanelComponent: React.FC<Props> = ({
  timeEntries,
  ...props
}) => {
  const { isIncluded, existsInTarget } = props.totalCountsByType;
  const recordCount = timeEntries.length;
  const areAllToggled = isIncluded + existsInTarget === recordCount;

  const handleFlipInclusions = (): void => {
    props.onUpdateAreAllIncluded(!areAllToggled);
  };

  const nonExistingRecords = timeEntries.filter(
    ({ existsInTarget }) => !existsInTarget,
  );

  return (
    <AccordionPanel rowNumber={5} title="Time Entries">
      {recordCount === 0 ? (
        <NoRecordsFound />
      ) : (
        <>
          {props.toolAction === ToolAction.Transfer && (
            <TimeEntryComparisonDisclaimer />
          )}
          <InclusionsTableTitle
            id="time-entries-desc"
            flipDisabled={nonExistingRecords.length === 0}
            onFlipAreAllIncluded={handleFlipInclusions}
          >
            {props.replaceMappingWithToolName("Time Entry Records in Source")}
          </InclusionsTableTitle>
          <TimeEntriesInclusionsTable
            timeEntries={timeEntries}
            totalCountsByType={props.totalCountsByType}
            onFlipIsIncluded={props.onFlipIsIncluded}
          />
        </>
      )}
    </AccordionPanel>
  );
};

const mapStateToProps = (state: ReduxState): ConnectStateProps => ({
  replaceMappingWithToolName: replaceMappingWithToolNameSelector(state),
  timeEntries: timeEntriesForInclusionsTableSelector(state),
  toolAction: toolActionSelector(state),
  totalCountsByType: timeEntriesTotalCountsByTypeSelector(state),
});

const mapDispatchToProps: ConnectDispatchProps = {
  onFlipIsIncluded: flipIsTimeEntryIncluded,
  onUpdateAreAllIncluded: updateAreAllTimeEntriesIncluded,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimeEntriesInclusionsPanelComponent);
