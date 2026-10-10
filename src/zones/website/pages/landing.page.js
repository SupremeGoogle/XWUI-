import { XWUIProgressBar, XWUIDisplayKbd } from '@exonware/xwui/basic';
import { h, ensureStylesheet } from '../../../core/dom.js';
import {
  pageSession,
  routeAction,
  titleBlock,
  assetImage,
} from '../../../components/xwf-ui.js';
import { XWFHeroScene } from '../../../components/XWFHeroScene/XWFHeroScene.js';
import { HERO_ZOOM } from '../../../components/XWFHeroScene/XWFHeroScene.model.js';

export default {
  id: 'landing',
  path: '/',
  layout: 'website',
  title: 'xwflow',
  async mount(el, ctx) {
    ensureStylesheet(
      'xwf-landing-css',
      new URL('./landing.css', import.meta.url),
    );
    const session = pageSession(el);
    const { ui, scope } = session;
    const data = await ctx.api.websiteApi.getLanding();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    const hero = data.hero;
    const sceneHost = ui.mount(XWFHeroScene, { scene: data.scene });
    sceneHost.id = 'sandbox';
    let sceneBusy = false;
    scope.listen(sceneHost, 'xwf-action', async (event) => {
      const action = event.detail.action;
      if (sceneBusy) return;
      if (action === 'reset')
        sceneHost.xw.updateData({
          scene: structuredClone(data.scene),
          zoom: HERO_ZOOM.initial,
        });
      else if (action === 'in' || action === 'out')
        sceneHost.xw.updateData({
          zoom: Math.min(
            HERO_ZOOM.max,
            Math.max(
              HERO_ZOOM.min,
              sceneHost.xw.data.zoom +
                (action === 'in' ? HERO_ZOOM.step : -HERO_ZOOM.step),
            ),
          ),
        });
      else if (action === 'run') {
        sceneBusy = true;
        sceneHost.xw.updateData({ busy: true });
        try {
          const result = await ctx.api.websiteApi.runSandbox();
          if (session.active) {
            sceneHost.xw.updateData({ scene: { ...data.scene, ...result } });
            ctx.notify.success(result.message);
          }
        } catch (error) {
          if (session.active) ctx.notify.error(error.message);
        } finally {
          sceneBusy = false;
          if (session.active) sceneHost.xw.updateData({ busy: false });
        }
      }
    });
    const heroSection = h(
      'section',
      { class: 'xwf-landing-hero' },
      h('div', {
        class: 'halo xwf-landing-hero__violet',
        'aria-hidden': 'true',
      }),
      h('div', { class: 'halo xwf-landing-hero__cyan', 'aria-hidden': 'true' }),
      h(
        'div',
        { class: 'wrap stack gap24 center xwf-landing-hero__copy' },
        routeAction(
          ui,
          {
            label: data.announcement,
            path: data.prompt.path,
            variant: 'outline',
          },
          { size: 'sm' },
        ),
        h(
          'h1',
          { class: 'h-mega' },
          hero.heading,
          h('br'),
          h('span', { class: 'grad-text' }, hero.accent),
        ),
        h('p', { class: 'lead' }, hero.description),
        h(
          'div',
          { class: 'wrapf gap12 xwf-landing__center-actions' },
          hero.actions.map((action) => routeAction(ui, action, { size: 'lg' })),
        ),
        h(
          'div',
          { class: 'wrapf gap16 small sec xwf-landing__center-actions' },
          hero.promises.map((promise) =>
            h(
              'span',
              { class: 'rowf gap8' },
              ui.icon('check', { color: 'var(--xw-lime)' }),
              promise,
            ),
          ),
        ),
      ),
      sceneHost,
    );
    const statistics = h(
      'section',
      { class: 'band tight' },
      h(
        'div',
        { class: 'wrap' },
        ui.card(
          h(
            'div',
            { class: 'g4 xwf-landing__stats' },
            data.stats.map((stat) => ui.statistic(stat)),
          ),
        ),
      ),
    );
    const marquee = h(
      'section',
      { class: 'xwf-landing__marquee', 'aria-label': data.directoryLabel },
      h(
        'div',
        { class: 'fade-x' },
        h(
          'div',
          { class: 'marquee', 'aria-hidden': 'true' },
          [...data.steps, ...data.steps].map((step) =>
            ui.tag(step.name, 'default', { className: `xw-tone-${step.tone}` }),
          ),
        ),
      ),
    );
    const prompt = data.prompt;
    const promptInput = ui.text(
      { value: prompt.value, label: prompt.eyebrow },
      null,
      { variant: 'filled', ariaLabel: prompt.eyebrow },
    );
    const promptSection = h(
      'section',
      { id: 'how', class: 'band' },
      h(
        'div',
        { class: 'wrap wrapf gap48 xwf-landing__split' },
        h(
          'div',
          { class: 'stack gap24 xwf-landing__half' },
          titleBlock(prompt),
          ui.card(
            h(
              'div',
              { class: 'stack gap12' },
              promptInput,
              h(
                'div',
                { class: 'rowf gap8' },
                ui.tag(prompt.workspace),
                ui.button(prompt.action, {
                  size: 'sm',
                  className: 'sp',
                  onClick: () =>
                    ctx.navigate(
                      `${prompt.path}?prompt=${encodeURIComponent(promptInput.xw.getValue())}`,
                    ),
                }),
              ),
            ),
            { padding: 'small' },
          ),
          h(
            'div',
            { class: 'wrapf gap8' },
            prompt.suggestions.map((suggestion) =>
              ui.button(suggestion, {
                variant: 'secondary',
                size: 'sm',
                onClick: () => promptInput.xw.setValue(suggestion),
              }),
            ),
          ),
        ),
        h(
          'div',
          { class: 'xwf-landing__half' },
          ui.card(
            h(
              'div',
              { class: 'stack gap16' },
              h(
                'div',
                { class: 'rowf gap8' },
                h('b', {}, prompt.draft),
                ui.tag(prompt.streaming, 'default', {
                  className: 'xw-tone-violet',
                }),
                h('span', { class: 'xs ter sp' }, prompt.count),
              ),
              h(
                'div',
                { class: 'xwf-landing__draft stack gap12' },
                prompt.steps.map((step, index) =>
                  ui.card(
                    h(
                      'div',
                      { class: 'rowf gap12' },
                      ui.icon(step.icon, { color: `var(--xw-${step.tone})` }),
                      h(
                        'div',
                        { class: 'grow' },
                        h('div', { class: 'b small' }, step.name),
                        h('div', { class: 'xs sec' }, step.type),
                      ),
                      ui.status(
                        '',
                        index === prompt.steps.length - 1
                          ? 'warning'
                          : 'success',
                      ),
                    ),
                    { padding: 'small' },
                  ),
                ),
              ),
              ui.alert({ message: prompt.notice }, { variant: 'success' }),
            ),
            { className: 'glow-v' },
          ),
        ),
      ),
    );
    const f = data.features;
    const bento = h(
      'section',
      { class: 'band' },
      h(
        'div',
        { class: 'wrap stack gap48' },
        titleBlock(f, true),
        h(
          'div',
          { class: 'xwf-landing__bento' },
          ui.card(
            h(
              'div',
              { class: 'stack gap24' },
              ui.tag(f.receipt.tag, 'default', { className: 'xw-tone-cyan' }),
              h(
                'h3',
                { class: 'h3 xwf-landing__large-card-title' },
                f.receipt.title,
              ),
              h('p', { class: 'sec' }, f.receipt.text),
              h(
                'div',
                { class: 'stack gap12' },
                data.scene.receipt.map((row, index) =>
                  h(
                    'div',
                    { class: 'xwf-landing__receipt-row' },
                    h('span', { class: 'small b' }, row.label),
                    ui.mount(
                      XWUIProgressBar,
                      { value: row.progress, label: row.label },
                      {
                        color: row.variant === 'error' ? 'error' : 'primary',
                        size: 'sm',
                        accentColor: `var(--xw-${row.tone})`,
                      },
                    ),
                    h('span', { class: 'mono xs ter' }, row.value),
                  ),
                ),
              ),
              assetImage(
                data.assets,
                data.assetRefs.hero,
                'xwf-landing__receipt-art',
                true,
              ),
            ),
            { className: 'xwf-landing__span4' },
          ),
          ui.card(
            h(
              'div',
              { class: 'stack gap16' },
              ui.tag(f.states.tag, 'default', { className: 'xw-tone-violet' }),
              h('h3', { class: 'h3' }, f.states.title),
              h(
                'div',
                { class: 'stack gap8' },
                f.states.items.map((item) =>
                  ui.card(ui.status(item.label, item.variant), {
                    padding: 'small',
                  }),
                ),
              ),
            ),
            { className: 'xwf-landing__span2' },
          ),
          ui.card(
            h(
              'div',
              { class: 'stack gap16' },
              ui.tag(f.keyboard.tag, 'primary'),
              h('h3', { class: 'h3' }, f.keyboard.title),
              h(
                'div',
                { class: 'wrapf gap8' },
                f.keyboard.keys.map((key) =>
                  ui.mount(XWUIDisplayKbd, { keys: key }, { size: 'lg' }),
                ),
              ),
              h('p', { class: 'small sec' }, f.keyboard.text),
            ),
            { className: 'xwf-landing__span2' },
          ),
          ui.card(
            h(
              'div',
              { class: 'stack gap16' },
              ui.tag(f.languages.tag, 'default', { className: 'xw-tone-pink' }),
              h(
                'div',
                {
                  class: 'xwf-landing__arabic grad-text',
                  lang: 'ar',
                  dir: 'rtl',
                },
                f.languages.arabic,
              ),
              h('p', { class: 'small sec' }, f.languages.text),
            ),
            { className: 'xwf-landing__span2' },
          ),
          ui.card(
            h(
              'div',
              { class: 'stack gap8' },
              ui.tag(f.hosting.tag, 'default', { className: 'xw-tone-orange' }),
              h('h3', { class: 'h3' }, f.hosting.title),
              assetImage(
                data.assets,
                data.assetRefs.servers,
                'xwf-landing__servers',
                true,
              ),
            ),
            { className: 'xwf-landing__span2' },
          ),
        ),
      ),
    );
    const white = data.whiteLabel;
    const whiteLabel = h(
      'section',
      { class: 'band' },
      h(
        'div',
        { class: 'wrap wrapf gap48 xwf-landing__split' },
        h(
          'div',
          { class: 'stack gap24 xwf-landing__white-copy' },
          titleBlock(white),
          h(
            'div',
            { class: 'stack gap12' },
            white.features.map((label) =>
              h(
                'div',
                { class: 'rowf gap12' },
                ui.icon('check', { color: 'var(--xw-lime)' }),
                h('span', { class: 'grow' }, label),
                ui.tag(data.labels.planned, 'default', {
                  className: 'xw-tone-plan',
                }),
              ),
            ),
          ),
          routeAction(ui, { label: white.action, path: white.path }),
        ),
        h(
          'div',
          { class: 'xwf-landing__fan' },
          white.brands.map((brand, index) =>
            h(
              'div',
              {
                class: 'xwf-landing__brand-card',
                style: {
                  '--xwf-tone': `var(--xw-${brand.tone})`,
                  '--xwf-card-index': index,
                },
              },
              ui.card(
                h(
                  'div',
                  { class: 'stack gap16' },
                  h(
                    'div',
                    { class: 'rowf gap8' },
                    assetImage(
                      data.assets,
                      data.assetRefs.samples[index].logo,
                      'xwf-landing__sample-logo',
                      true,
                    ),
                    h('b', { class: 'disp' }, brand.name),
                  ),
                  h('div', { class: 'xwf-landing__brand-surface' }),
                  h(
                    'div',
                    { class: 'rowf gap8' },
                    ui.button(white.run, {
                      size: 'sm',
                      gradient: `var(--xw-${brand.tone})`,
                      onClick: () => ctx.navigate(data.brandingPath),
                    }),
                    ui.tag(white.published, 'default', {
                      className: `xw-tone-${brand.tone}`,
                    }),
                  ),
                  index === 1 && h('p', { class: 'xs sec' }, white.note),
                ),
                { padding: 'medium' },
              ),
            ),
          ),
        ),
      ),
    );
    const notations = h(
      'section',
      { class: 'band xwf-landing__notations' },
      h(
        'div',
        { class: 'wrap' },
        ui.card(
          h(
            'div',
            { class: 'wrapf gap48 xwf-landing__split' },
            h(
              'div',
              { class: 'stack gap24 xwf-landing__half' },
              titleBlock(data.notations),
              h(
                'div',
                { class: 'wrapf gap12' },
                data.notations.actions.map((action) => routeAction(ui, action)),
              ),
            ),
            h(
              'div',
              { class: 'wrapf gap8 xwf-landing__half' },
              data.notationItems.map((item) =>
                item.path
                  ? routeAction(
                      ui,
                      {
                        label: item.label,
                        path: item.path,
                        variant: 'secondary',
                      },
                      { size: 'sm' },
                    )
                  : ui.tag(item.label, 'default', {
                      className: `xw-tone-${item.tone}`,
                    }),
              ),
            ),
          ),
        ),
      ),
    );
    const migration = h(
      'section',
      { id: 'compat', class: 'band' },
      h(
        'div',
        { class: 'wrap stack gap48' },
        titleBlock(data.migration),
        h(
          'div',
          { class: 'g4' },
          data.dialects.map((dialect) =>
            ui.card(
              h(
                'div',
                { class: 'stack gap12' },
                h(
                  'span',
                  {
                    class: 'xwf-landing__monogram',
                    style: { '--xwf-tone': `var(--xw-${dialect.tone})` },
                  },
                  dialect.initials,
                ),
                h('b', {}, dialect.name),
                h(
                  'span',
                  { class: 'xs sec' },
                  data.migration.depth,
                  ' ',
                  ui.tag(dialect.depth, 'default', {
                    className: 'xw-tone-plan',
                  }),
                ),
              ),
              { padding: 'medium' },
            ),
          ),
        ),
      ),
    );
    const cta = h(
      'section',
      { class: 'band' },
      h(
        'div',
        { class: 'wrap' },
        ui.card(
          h(
            'div',
            { class: 'xwf-landing__cta stack gap24' },
            h('div', {
              class: 'ring xwf-landing__cta-ring',
              'aria-hidden': 'true',
            }),
            titleBlock(data.cta),
            h(
              'div',
              { class: 'wrapf gap12' },
              data.cta.actions.map((action) =>
                routeAction(ui, action, { size: 'lg' }),
              ),
            ),
          ),
          { className: 'gb' },
        ),
      ),
    );
    const r = data.resources;
    const comparisonDetail = h('div', { class: 'stack gap16' });
    const renderComparison = (id) =>
      comparisonDetail.replaceChildren(
        h('h3', { class: 'h3' }, `${data.comparisonPrefix} ${id}`),
        h('p', { class: 'small sec' }, r.comparison.text),
        ui.list(r.comparison.features),
      );
    const selected = r.comparison.names.includes(ctx.query.compare)
      ? ctx.query.compare
      : r.comparison.names[0];
    renderComparison(selected);
    const resources = h(
      'section',
      { class: 'band tight' },
      h(
        'div',
        { class: 'wrap stack gap32' },
        h(
          'section',
          { id: 'c', class: 'stack gap16' },
          h('h2', { class: 'h3' }, r.comparison.title),
          ui.tabs(
            r.comparison.names.map((name) => ({ id: name, label: name })),
            selected,
            renderComparison,
          ),
          comparisonDetail,
          routeAction(ui, {
            label: r.comparison.action,
            path: r.comparison.path,
          }),
        ),
        h(
          'div',
          { class: 'g2' },
          h(
            'section',
            { id: 't' },
            ui.card(
              h(
                'div',
                { class: 'stack gap12' },
                h('h2', { class: 'h3' }, r.templates.title),
                r.templates.items.map((item) => routeAction(ui, item)),
              ),
            ),
          ),
          h(
            'section',
            { id: 's' },
            ui.card(
              h(
                'div',
                { class: 'stack gap12' },
                h('h2', { class: 'h3' }, r.capabilities.title),
                r.capabilities.items.map((item) =>
                  h(
                    'div',
                    { class: 'rowf gap12' },
                    h('span', { class: 'grow' }, item.label),
                    ui.status(item.status, item.variant),
                  ),
                ),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'g2' },
          [r.docs, r.security].map((item, index) =>
            h(
              'section',
              { id: index ? 'sec' : 'docs' },
              ui.card(
                h(
                  'div',
                  { class: 'stack gap16' },
                  h('h2', { class: 'h3' }, item.title),
                  h('p', { class: 'small sec' }, item.text),
                  routeAction(ui, { label: item.action, path: item.path }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    el.replaceChildren(
      heroSection,
      statistics,
      marquee,
      promptSection,
      bento,
      whiteLabel,
      notations,
      migration,
      cta,
      resources,
    );
    return session.handle;
  },
};
