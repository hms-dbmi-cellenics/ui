// File containing data-test id and class values for use in Cypress tests.

const ids = {
  NAVIGATION_MENU: 'navigation-menu',
  CONFIRM_CREATE_NEW_PROJECT: 'confirm-create-new-project',
  CREATE_NEW_PROJECT_BUTTON: 'create-new-project-button',
  PROJECT_NAME: 'project-name',
  PROJECT_DESCRIPTION: 'project-description',
  LAUNCH_ANALYSIS_BUTTON: 'launch-analysis-button',
  QC_STATUS_TEXT: 'qc-status-text',

  FILE_UPLOAD_BUTTON: 'file-upload-button',
  FILE_UPLOAD_DROPZONE: 'file-upload-dropzone',
  FILE_UPLOAD_INPUT: 'file-upload-input',
  ADD_SAMPLES_BUTTON: 'add-samples-button',
};

const classes = {
  PAGE_HEADER: 'data-test-page-header',
  LAUNCH_ANALYSIS_ITEM: 'data-test-launch-analysis-item',
  NEW_PROJECT_MODAL: 'data-test-new-project-modal',
  DELETE_PROJECT_MODAL: 'data-test-delete-project-modal',
  DELETE_PROJECT_MODAL_INPUT: 'data-test-delete-project-input',
  SAMPLE_CELL: 'data-test-sample-cell',
  PROJECT_CARD: 'data-test-project-card',
  QC_STEP_COMPLETED: 'data-test-qc-step-completed',
  QC_STEP_NOT_COMPLETED: 'data-test-qc-step-not-completed',

  EDITABLE_FIELD_DELETE_BUTTON: 'data-test-delete-editable-field-button',
  SAMPLES_TABLE_NAME_CELL: 'data-test-sample-in-table-name',
};

export default {
  ids,
  classes,
};
