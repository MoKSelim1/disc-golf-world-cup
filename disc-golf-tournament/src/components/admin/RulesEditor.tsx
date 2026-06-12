import { useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { renderRulesMarkdown, rulesMarkdownForTournament } from '../../lib/rules';

function wrapSelection(value: string, start: number, end: number, prefix: string, suffix = prefix): [string, number, number] {
  const selected = value.slice(start, end) || 'formatted text';
  const nextValue = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  return [nextValue, start + prefix.length, start + prefix.length + selected.length];
}

export function RulesEditor() {
  const { data, dispatch } = useTournament();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const rulesMarkdown = rulesMarkdownForTournament(data);

  function update(value: string) {
    dispatch({ type: 'UPDATE_RULES', rulesMarkdown: value });
  }

  function format(prefix: string, suffix = prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const [nextValue, nextStart, nextEnd] = wrapSelection(
      rulesMarkdown,
      textarea.selectionStart,
      textarea.selectionEnd,
      prefix,
      suffix,
    );
    update(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  function addHeading() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = rulesMarkdown.lastIndexOf('\n', start - 1) + 1;
    const nextValue = `${rulesMarkdown.slice(0, lineStart)}### ${rulesMarkdown.slice(lineStart)}`;
    update(nextValue);
    window.requestAnimationFrame(() => textarea.focus());
  }

  function addBullet() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = rulesMarkdown.lastIndexOf('\n', start - 1) + 1;
    const nextValue = `${rulesMarkdown.slice(0, lineStart)}- ${rulesMarkdown.slice(lineStart)}`;
    update(nextValue);
    window.requestAnimationFrame(() => textarea.focus());
  }

  function resetDefaults() {
    update('');
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Rules</h2>
        <span>Edit the public Rules tab</span>
      </div>
      <p className="panel-note">
        Use Markdown-style formatting: headings, bold, italic, and bullet lists. Leaving this blank uses the format-specific default rules.
      </p>
      <div className="rules-editor-toolbar" aria-label="Rules formatting tools">
        <button onClick={addHeading} type="button">Heading</button>
        <button onClick={() => format('**')} type="button">Bold</button>
        <button onClick={() => format('*')} type="button">Italic</button>
        <button onClick={addBullet} type="button">Bullet</button>
        <button onClick={resetDefaults} type="button">Use Default</button>
      </div>
      <div className="rules-editor-grid">
        <label>
          Rules text
          <textarea
            onChange={(event) => update(event.target.value)}
            ref={textareaRef}
            rows={16}
            value={rulesMarkdown}
          />
        </label>
        <article className="subpanel prose rules-preview">
          <div className="panel-heading">
            <h3>Preview</h3>
            <span>Public display</span>
          </div>
          {renderRulesMarkdown(rulesMarkdown)}
        </article>
      </div>
    </section>
  );
}
