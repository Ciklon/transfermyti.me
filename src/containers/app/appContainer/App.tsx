import React from 'react';
import { Wizard, Steps, Step } from 'react-albus';
import { Section } from 'bloomer';
import NotificationsDisplay from '~/containers/app/notificationsDisplay/NotificationsDisplay';
import SelectTransferTypeStep from '~/containers/app/selectTransferTypeStep/SelectTransferTypeStep';
import EnterCredentialsStep from '~/containers/credentials/enterCredentialsStep/EnterCredentialsStep';
import SelectTogglWorkspacesStep from '~/containers/entities/selectTogglWorkspacesStep/SelectTogglWorkspacesStep';
import SelectTogglInclusionsStep from '~/containers/entities/selectTogglInclusionsStep/SelectTogglInclusionsStep';
import ReviewClockifyDetailsStep from '~/containers/entities/reviewClockifyDetailsStep/ReviewClockifyDetailsStep';
import Header from './components/Header';

const App: React.FC = () => (
  <>
    <Header />
    <Wizard>
      <Section>
        <Steps>
          <Step
            id="selectWorkflowType"
            render={({ next }) => <SelectTransferTypeStep next={next} />}
          />
          <Step
            id="enterCredentials"
            render={({ previous, next }) => (
              <EnterCredentialsStep previous={previous} next={next} />
            )}
          />
          <Step
            id="selectTogglWorkspaces"
            render={({ previous, next }) => (
              <SelectTogglWorkspacesStep previous={previous} next={next} />
            )}
          />
          <Step
            id="reviewTogglData"
            render={({ previous, next }) => (
              <SelectTogglInclusionsStep previous={previous} next={next} />
            )}
          />
          <Step
            id="reviewClockifyDetails"
            render={({ previous, next }) => (
              <ReviewClockifyDetailsStep previous={previous} next={next} />
            )}
          />
          <Step
            id="wrapUp"
            render={({ replace }) => <div>You're all done!</div>}
          />
        </Steps>
      </Section>
    </Wizard>
    <NotificationsDisplay />
  </>
);

export default App;