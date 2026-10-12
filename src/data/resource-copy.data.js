/** Shared management-page copy and simulated backend limits. */
export const RESOURCE_COPY = {
  notice: 'Local demo / changes are saved in this browser',
  create: 'Create', edit: 'Edit', save: 'Save', cancel: 'Cancel', close: 'Close',
  enable: 'Enable', disable: 'Disable', archive: 'Archive', restore: 'Restore', export: 'Export JSON',
  enabled: 'Enabled', disabled: 'Disabled', archived: 'Archived', status: 'Status',
  all: 'All current records', archivedOnly: 'Archived records', search: 'Search records', filter: 'Record status',
  total: 'Total records', active: 'Enabled records', saved: 'Changes saved.', created: 'Record created.',
  archivedNotice: 'Record archived. You can restore it from the archived list.', restored: 'Record restored.',
  updated: 'Updated', actions: 'Record actions', rows: '{n} matching records',
  empty: 'No records to show', emptyBody: 'Create a record or change the search and filters.',
  error: 'Could not load these records', retry: 'Try again',
  archiveTitle: 'Archive {name}?', archiveBody: 'The record leaves the current list. You can restore it from Archived records.',
  disableTitle: 'Disable {name}?', disableBody: 'This changes the local demo configuration. Stored run receipts are preserved.',
  createTitle: 'Create {resource}', editTitle: 'Edit {name}',
  required: '{field} is required.', invalid: '{field} has an invalid value.',
  unavailable: 'This operation is not available for this resource.',
  notFound: 'Record not found.', resourceNotFound: 'Resource not found.',
  run: 'Use template', retryRun: 'Retry run', actionDone: 'Action completed.',
};
export const RESOURCE_RULES = Object.freeze({ pageSize: 8, maxText: 4000, failureRate: .04, nameMax: 120 });
