import { WEBSITE_ROUTES } from '../../../core/routes.js';
import { ensureStylesheet } from '../../../core/dom.js';
import { pageSession } from '../../../components/xwf-ui.js';
import { createHeroSection } from './landing/hero.section.js';
import { createPromptSection } from './landing/prompt.section.js';
import { createFeaturesSection } from './landing/features.section.js';
import { createBrandingSection } from './landing/branding.section.js';
import { createResourcesSection } from './landing/resources.section.js';

export default {
  id: 'landing',
  path: WEBSITE_ROUTES.home,
  layout: 'website',
  title: 'xwflow',
  async mount(el, ctx) {
    ensureStylesheet(
      'xwf-landing-css',
      new URL('./landing.css', import.meta.url),
    );
    const session = pageSession(el, ctx);
    const { ui, scope } = session;
    const data = await ctx.api.websiteApi.getLanding();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    const options = { data, ctx, session, ui, scope };
    el.replaceChildren(
      ...createHeroSection(options), createPromptSection(options), createFeaturesSection(options),
      createBrandingSection(options), ...createResourcesSection(options),
    );
    return session.handle;
  },
};
