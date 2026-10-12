import { WEBSITE_ROUTES } from '../../../core/routes.js';
import { XWUICodeBlock } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { pageSession, routeAction, assetImage } from '../../../components/xwf-ui.js';

export default {
  id: 'self-host',
  path: WEBSITE_ROUTES.selfHost,
  layout: 'website',
  title: 'Self-host',
  async mount(el, ctx) {
    const session = pageSession(el, ctx);
    const { ui } = session;
    const data = await ctx.api.websiteApi.getSelfHost();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    async function copy(code) {
      try {
        await navigator.clipboard.writeText(code);
        if (session.active) ctx.notify.success(data.labels.copied);
      } catch {
        if (session.active) ctx.notify.error(data.labels.copyError);
      }
    }
    const steps = h(
      'ol',
      { class: 'xwf-quickstart__steps stack gap24' },
      data.steps.map((step, index) =>
        h(
          'li',
          {
            class: 'xwf-quickstart__step',
            style: { '--xwf-tone': `var(--xw-${step.tone})` },
          },
          h(
            'span',
            { class: 'xwf-quickstart__number', 'aria-hidden': 'true' },
            index + 1,
          ),
          ui.card(
            h(
              'div',
              { class: 'stack gap12' },
              h('h2', { class: 'h3' }, step.title),
              step.description && h('p', { class: 'sec' }, step.description),
              step.code &&
                h(
                  'div',
                  { class: 'stack gap8' },
                  ui.mount(
                    XWUICodeBlock,
                    { code: step.code },
                    {
                      language: 'bash',
                      upgradeToEditor: false,
                      copyable: false,
                    },
                  ),
                  ui.button(data.labels.copy, {
                    size: 'sm',
                    variant: 'ghost',
                    icon: 'copy',
                    onClick: () => copy(step.code),
                  }),
                ),
              step.items && ui.list(step.items),
              step.actions &&
                h(
                  'div',
                  { class: 'wrapf gap12' },
                  step.actions.map((action) => routeAction(ui, action)),
                ),
            ),
          ),
        ),
      ),
    );
    const aside = h(
      'aside',
      { class: 'xwf-quickstart__aside stack gap16' },
      ui.card(
        h(
          'div',
          { class: 'stack gap12' },
          h('h2', { class: 'h3' }, data.defaults.title),
          data.defaults.items.map((item) =>
            h(
              'div',
              { class: 'rowf small gap12' },
              h('span', { class: 'sec' }, item.label),
              h('span', { class: 'mono sp' }, item.value),
            ),
          ),
        ),
      ),
      ui.card(
        h(
          'div',
          { class: 'stack gap8' },
          ui.icon('lock', { color: 'var(--xw-lime)' }),
          h('h2', { class: 'h3' }, data.secrets.title),
          h('p', { class: 'small sec' }, data.secrets.description),
        ),
      ),
      ui.alert({ message: data.warning }, { variant: 'warning' }),
    );
    el.replaceChildren(
      h(
        'section',
        { class: 'xwf-public-hero' },
        h(
          'div',
          { class: 'wrap wrapf gap48' },
          h(
            'div',
            { class: 'stack gap24 xwf-landing__half' },
            h('span', { class: 'eyebrow' }, data.eyebrow),
            h(
              'h1',
              { class: 'h1' },
              data.heading,
              h('br'),
              h('span', { class: 'grad-text' }, data.accent),
            ),
            h('p', { class: 'lead' }, data.description),
            h(
              'div',
              { class: 'wrapf gap12' },
              data.actions.map((action) =>
                routeAction(ui, action, { size: 'lg' }),
              ),
            ),
          ),
          assetImage(
            data.assets,
            data.assetRefs.servers,
            'xwf-server-art',
            true,
          ),
        ),
      ),
      h(
        'div',
        { id: 'steps', class: 'wrap wrapf gap48 xwf-quickstart' },
        steps,
        aside,
      ),
    );
    return session.handle;
  },
};
