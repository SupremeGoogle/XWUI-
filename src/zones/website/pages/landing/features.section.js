import { XWUIProgressBar, XWUIDisplayKbd } from '@exonware/xwui/basic';
import { h } from '../../../../core/dom.js';
import { titleBlock, assetImage } from '../../../../components/xwf-ui.js';

export function createFeaturesSection({ data, ctx, session, ui, scope }) {
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
  return bento;
}
