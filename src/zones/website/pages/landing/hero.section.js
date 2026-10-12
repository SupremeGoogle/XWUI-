import { h } from '../../../../core/dom.js';
import { routeAction } from '../../../../components/xwf-ui.js';
import { XWFHeroScene } from '../../../../components/XWFHeroScene/XWFHeroScene.js';
import { HERO_ZOOM } from '../../../../components/XWFHeroScene/XWFHeroScene.model.js';

export function createHeroSection({ data, ctx, session, ui, scope }) {
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
  return [heroSection, statistics, marquee];
}
