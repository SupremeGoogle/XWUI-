/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
import { FONT_FAMILIES } from './XWFBrandPreview.model.js';
export function projectXWFBrandPreviewView(
  { kit, content, dirty, labels },
  handlers,
  ui,
) {
  const font = FONT_FAMILIES[kit.font] ?? FONT_FAMILIES.unbounded;
  const bodyFont = kit.font === 'unbounded' ? FONT_FAMILIES.manrope : font;
  return h(
    'section',
    {
      class: 'xwf-brand-preview',
      style: {
        '--xwf-primary': kit.primary,
        '--xw-lime': kit.primary,
        '--xw-ink': kit.buttonText,
        '--xw-tx': kit.text,
        '--xw-bg': kit.background,
        '--accent-primary': kit.primary,
        '--accent-primary-ink': kit.buttonText,
        '--text-on-accent': kit.buttonText,
        '--text-inverse': kit.buttonText,
        '--text-primary': kit.text,
        '--bg-primary': kit.background,
        '--xwf-font': bodyFont,
        '--xw-font-body': bodyFont,
        '--xw-font-display': font,
        fontFamily: bodyFont,
      },
      'aria-label': content.title,
    },
    h(
      'div',
      { class: 'rowf gap8' },
      h('b', {}, content.title),
      ui.tag(dirty ? labels.notSaved : labels.saved, 'default', {
        className: 'xw-tone-plan',
      }),
    ),
    h(
      'div',
      { class: 'xwf-brand-preview__device' },
      h('div', { class: 'xwf-brand-preview__halo' }),
      h(
        'div',
        {
          class: 'xwf-brand-preview__window',
          style: { background: kit.background, color: kit.text },
        },
        h(
          'div',
          { class: 'rowf gap8 xwf-brand-preview__bar' },
          kit.logo
            ? h('img', {
                src: kit.logo,
                alt: kit.productName,
                class: 'xwf-brand-preview__logo',
              })
            : h('span', { class: 'xwf-brand-preview__mark' }),
          h('b', { style: { fontFamily: font } }, kit.productName),
          h(
            'span',
            { class: 'sp xs', style: { color: kit.primary } },
            `${kit.assistantName} ${content.assistantSuffix}`,
          ),
        ),
        h(
          'div',
          { class: 'stack gap12 xwf-brand-preview__body' },
          h(
            'div',
            { class: 'rowf gap8' },
            h('b', {}, content.flow),
            ui.tag(content.published),
          ),
          h(
            'div',
            { class: 'xwf-brand-preview__graph', dir: 'ltr' },
            content.steps.map((step) =>
              h('div', { class: 'xwf-brand-preview__node' }, step),
            ),
          ),
          h(
            'div',
            { class: 'rowf gap8' },
            ui.button(content.run, {
              size: 'sm',
              onClick: () => handlers.onAction({ action: 'run' }),
            }),
            ui.button(content.share, {
              variant: 'secondary',
              size: 'sm',
              onClick: () => handlers.onAction({ action: 'share' }),
            }),
          ),
          !kit.removeMarks && h('span', { class: 'xs' }, content.vendor),
        ),
      ),
    ),
  );
}
