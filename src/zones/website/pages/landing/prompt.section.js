import { h } from '../../../../core/dom.js';
import { titleBlock } from '../../../../components/xwf-ui.js';

export function createPromptSection({ data, ctx, session, ui, scope }) {
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
  return promptSection;
}
