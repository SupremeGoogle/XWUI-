/** Sample content for the developer playground page only. */
export const PLAYGROUND_SAMPLE = {
  title: 'Component playground',
  buttons: [
    { text: 'Primary', conf: { variant: 'primary' } },
    { text: 'Secondary', conf: { variant: 'secondary' } },
    { text: 'Outline', conf: { variant: 'outline' } },
    { text: 'Ghost', conf: { variant: 'ghost' } },
    { text: 'Danger', conf: { variant: 'danger' } },
    { text: 'With icon', conf: { variant: 'secondary', icon: 'play' } },
  ],
  tags: [
    { label: 'Default', variant: 'default' },
    { label: 'Primary', variant: 'primary' },
    { label: 'Success', variant: 'success' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Error', variant: 'error' },
  ],
  template: {
    title: 'Triggers',
    items: [
      { id: 'webhook', label: 'Webhook', hint: 'Trigger' },
      { id: 'schedule', label: 'Schedule', hint: 'Trigger' },
      { id: 'condition', label: 'Condition', hint: 'Control' },
    ],
  },
};
