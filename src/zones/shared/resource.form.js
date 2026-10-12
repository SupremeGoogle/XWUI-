/** XWUI form projection for schema-backed resource records; validation is owned by the API. */
import { XWUIInputText, XWUIInputTextarea, XWUIInputNumber, XWUIInputSelect } from '@exonware/xwui/basic';
import { h } from '../../core/dom.js';
import { createXwfKit } from '../../components/xwf-ui.js';
import { template } from '../../core/format.js';

export async function editResource({ definition, record, ui }) {
  const kit = createXwfKit();
  const values = {};
  const content = h('div', { class: 'stack gap16 resource-form' });
  for (const field of definition.fields) {
    values[field.key] = record?.[field.key] ?? field.default ?? '';
    if (field.readOnly && !definition.allowCreate) continue;
    const host = h('div'); content.append(host);
    const Component = ['json', 'textarea'].includes(field.kind) ? XWUIInputTextarea : field.kind === 'number' ? XWUIInputNumber : field.kind === 'boolean' ? XWUIInputSelect : XWUIInputText;
    const input = kit.scope.mountField(Component, host, { label: field.label, value: values[field.key], ...(field.kind === 'boolean' ? { options: [{ value: 'true', label: definition.copy.enabled }, { value: 'false', label: definition.copy.disabled }] } : {}) }, {
      fullWidth: true, disabled: Boolean(record && field.readOnly), ariaLabel: field.label,
    });
    input.onChange(value => { values[field.key] = value; });
  }
  try {
    const choice = await ui.dialog({ title: record ? template(definition.copy.editTitle, record) : template(definition.copy.createTitle, { resource: definition.title }), content,
      actions: [{ id: 'cancel', label: definition.copy.cancel, variant: 'ghost' }, { id: 'save', label: definition.copy.save, variant: 'primary' }] });
    return choice === 'save' ? values : null;
  } finally { kit.scope.destroy(); }
}
