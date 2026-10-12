import { WEBSITE_ROUTES } from '../../../core/routes.js';
import { XWUITable, XWUIAccordion } from '@exonware/xwui/basic';
import { h } from '../../../core/dom.js';
import { pageSession, assetImage } from '../../../components/xwf-ui.js';
import { XWFPricingTiers } from '../../../components/XWFPricingTiers/XWFPricingTiers.js';

export default {
  id: 'pricing',
  path: WEBSITE_ROUTES.pricing,
  layout: 'website',
  title: 'Pricing',
  async mount(el, ctx) {
    const session = pageSession(el);
    const { ui } = session;
    const data = await ctx.api.websiteApi.getPricing();
    if (!session.active) return session.handle;
    ctx.setTitle(data.title);
    const contact = data.contact;
    const email = ui.text(
      {
        label: contact.email,
        placeholder: contact.emailPlaceholder,
        autocomplete: 'email',
        name: 'email',
      },
      null,
      { type: 'email', required: true },
    );
    const notes = ui.text(
      {
        label: contact.notes,
        placeholder: contact.notesPlaceholder,
        name: 'notes',
      },
      null,
      { required: true },
    );
    let busy = false;
    const send = ui.button(contact.action, { size: 'lg', onClick: submit });
    async function submit() {
      if (busy) return;
      busy = true;
      send.xw.updateConfig({ loading: true });
      try {
        await ctx.api.websiteApi.requestQuote({
          email: email.xw.getValue(),
          notes: notes.xw.getValue(),
        });
        if (session.active) {
          ctx.notify.success(contact.sent);
          email.xw.setValue('');
          notes.xw.setValue('');
        }
      } catch (error) {
        if (session.active) ctx.notify.error(error.message);
      } finally {
        busy = false;
        if (session.active) send.xw.updateConfig({ loading: false });
      }
    }
    const form = h(
      'form',
      {
        class: 'xwf-contact__form stack gap16',
        'aria-label': contact.action,
        onSubmit: (event) => {
          event.preventDefault();
          submit();
        },
      },
      email,
      notes,
      send,
    );
    el.replaceChildren(
      h(
        'section',
        { class: 'xwf-public-hero' },
        h('div', { class: 'xwf-public-hero__glow', 'aria-hidden': 'true' }),
        assetImage(
          data.assets,
          data.assetRefs.cube,
          'xwf-public-hero__art',
          true,
        ),
        h(
          'div',
          { class: 'wrap stack gap24 center xwf-public-hero__content' },
          h('span', { class: 'eyebrow' }, data.eyebrow),
          h(
            'h1',
            { class: 'h1' },
            data.heading,
            h('br'),
            h('span', { class: 'grad-text' }, data.accent),
          ),
          h('p', { class: 'lead' }, data.description),
        ),
      ),
      h(
        'div',
        { class: 'wrap stack gap48 xwf-public-main' },
        ui.mount(XWFPricingTiers, { tiers: data.tiers }),
        h(
          'section',
          { class: 'band tight stack gap24' },
          h('span', { class: 'eyebrow' }, data.compare.eyebrow),
          h('h2', { class: 'h2' }, data.compare.title),
          h('p', { class: 'sec' }, data.compare.description),
          h(
            'div',
            { class: 'scroll-x' },
            ui.mount(
              XWUITable,
              { columns: data.compare.columns, data: data.compare.rows },
              { size: 'md', hoverable: true },
            ),
          ),
        ),
        h(
          'section',
          { id: 'contact', class: 'xwf-contact wrapf gap48' },
          h(
            'div',
            { class: 'stack gap16 xwf-contact__copy' },
            h(
              'h2',
              { class: 'h2' },
              contact.heading,
              h('br'),
              h('span', { class: 'grad-text' }, contact.accent),
            ),
            h('p', { class: 'sec' }, contact.description),
          ),
          form,
        ),
        h(
          'section',
          { class: 'stack gap24' },
          h('h2', { class: 'h3' }, data.faqTitle),
          ui.mount(XWUIAccordion, { items: data.faq }, { mode: 'single' }),
        ),
      ),
    );
    return session.handle;
  },
};
