/** XWUI controls for a pending API wait; decision records never alter earlier attempts. */
import { h } from '../../../core/dom.js';
import { template } from '../../../core/format.js';

export function waitControls(kit, ctx, run, copy, onResolved) {
  if (run.status !== 'waiting' || !run.pendingWait) return null;
  let active = true;
  let busy = false;
  kit.scope.onDispose(() => { active = false; });
  const buttons = [];
  const decide = async (decision) => {
    if (busy || !active) return;
    const choice = await kit.ui.dialog({
      title: decision === 'approve' ? copy.approveTitle : copy.rejectTitle,
      content: template(decision === 'approve' ? copy.approveBody : copy.rejectBody, { step: run.pendingWait.stepName }),
      actions: [{ id: 'cancel', label: copy.cancel, variant: 'ghost' }, { id: decision, label: copy[decision], variant: decision === 'reject' ? 'danger' : 'primary' }],
      size: 'sm',
    });
    if (choice !== decision || !active) return;
    busy = true;
    buttons.forEach(button => button.xw.logic.updateConfig({ disabled: true }));
    try {
      const next = await ctx.api.studioApi.resolveWait(run.id, run.pendingWait.stepId, decision);
      if (!active) return;
      ctx.notify.success(decision === 'approve' ? copy.approved : copy.rejected);
      onResolved(next);
    } catch (error) {
      if (active) ctx.notify.fromError(error);
    } finally {
      busy = false;
      if (active) buttons.forEach(button => button.xw.logic.updateConfig({ disabled: false }));
    }
  };
  buttons.push(kit.ui.button(copy.approve, { variant: 'primary', size: 'sm', onClick: () => decide('approve') }),
    kit.ui.button(copy.reject, { variant: 'danger', size: 'sm', onClick: () => decide('reject') }));
  return h('div', { class: 'wrapf gap8 studio-wait-controls' }, kit.ui.tag(copy.waiting, 'warning'), buttons);
}
