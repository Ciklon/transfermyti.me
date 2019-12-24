import { createSelector } from "reselect";
import { ReduxState } from "~/redux/reduxTypes";
import { CredentialsModel } from "./credentialsTypes";

export const selectCredentials = createSelector(
  (state: ReduxState) => state.credentials,
  (credentials): CredentialsModel => credentials,
);

export const selectIsValidating = (state: ReduxState): boolean =>
  state.credentials.isValidating;

export const selectValidationErrorsByTool = createSelector(
  (state: ReduxState) => state.credentials.validationErrorsByTool,
  validationErrorsByTool => validationErrorsByTool,
);
