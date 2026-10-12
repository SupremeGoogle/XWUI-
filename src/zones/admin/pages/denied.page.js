import { ADMIN_ROUTES } from '../../../core/routes.js';
import { h } from '../../../core/dom.js';
import {
  pageSession,
  routeAction,
  assetImage,
} from '../../../components/xwf-ui.js';

export default {
  id: 'admin-quotas-denied',
  path: ADMIN_ROUTES.quotas,
  layout: 'admin',
  title: 'Quotas',
  async mount(el, ctx) {
    const session = pageSession(el);
    const { ui } = session;
    const data = await ctx.api.adminApi.getDenied();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    let sent = Boolean(data.requestRecord);
    let busy = false;
    const request = ui.button(sent ? data.sent : data.request, {
      size: 'lg',
      disabled: sent,
      onClick: async () => {
        if (sent || busy) return;
        busy = true;
        request.xw.updateConfig({ loading: true });
        try {
          await ctx.api.adminApi.requestAccess(data.resource);
          if (session.active) {
            sent = true;
            request.xw.updateData({ text: data.sent });
            ctx.notify.success(data.sentMessage);
          }
        } catch (error) {
          if (session.active) ctx.notify.error(error.message);
        } finally {
          busy = false;
          if (session.active)
            request.xw.updateConfig({ loading: false, disabled: sent });
        }
      },
    });
    el.replaceChildren(
      h(
        'div',
        { class: 'xwf-denied' },
        assetImage(data.assets, data.assetRefs.lock, 'xwf-denied__art', true),
        h(
          'div',
          { class: 'xwf-denied__card' },
          ui.card(
            h(
              'div',
              { class: 'stack gap24' },
              h(
                'div',
                { class: 'stack gap8 center' },
                h(
                  'h1',
                  { class: 'h2 xwf-page-title' },
                  data.heading,
                  ' ',
                  h('span', { class: 'grad-text' }, data.accent),
                ),
                h('p', { class: 'sec' }, data.description),
              ),
              h(
                'div',
                { class: 'g3 xwf-denied__roles' },
                data.roles.map((role) =>
                  ui.card(
                    h(
                      'div',
                      { class: 'stack gap4' },
                      h('span', { class: 'xs ter b' }, role.title),
                      h('b', {}, role.value),
                    ),
                    { padding: 'small' },
                  ),
                ),
              ),
              ui.list(
                data.steps.map((label, index) => ({
                  id: String(index),
                  label: `${index + 1}. ${label}`,
                })),
              ),
              h(
                'div',
                { class: 'wrapf gap12 xwf-denied__actions' },
                request,
                routeAction(
                  ui,
                  { label: data.back, path: data.backPath },
                  { size: 'lg' },
                ),
              ),
            ),
            { padding: 'large', className: 'gb' },
          ),
        ),
      ),
    );
    return session.handle;
  },
};
