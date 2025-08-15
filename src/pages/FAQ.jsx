import React, { useEffect, useMemo, useState, useRef } from 'react';
import faqs from '../data/faqs.json';

// slug/id pomocniczy (opcjonalnie: można użyć q${idx})
const toId = (q, idx) =>
  'q' + (idx ?? 0);

function AccordionItem({ q, a, id, defaultOpen = false, onToggle }) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);

  useEffect(() => {
    if (defaultOpen && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [defaultOpen]);

  const handleClick = () => {
    const next = !open;
    setOpen(next);
    // Deep-link w URL (hash)
    if (next) history.replaceState(null, '', `#${id}`);
    else history.replaceState(null, '', `#`);

    // Event do Plausible (jeśli obecny)
    try {
      if (window.plausible) window.plausible('faq_toggle', { props: { id, question: q, open: String(next) } });
    } catch {}
    onToggle?.(id, next);
  };

  return (
    <div ref={ref} className="border rounded-lg bg-white" id={id}>
      <button
        onClick={handleClick}
        className="w-full text-left px-4 py-3 font-semibold flex justify-between items-center"
        aria-expanded={open}
        aria-controls={`${id}-content`}
      >
        <span>{q}</span>
        <span className="text-gray-500">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div id={`${id}-content`} className="px-4 pb-4 pt-1 text-gray-700">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [query, setQuery] = useState('');
  const [forceOpenId, setForceOpenId] = useState(null);

  // JSON-LD (FAQPage)
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  }), []);

  // Filtrowanie po zapytaniu
  const filteredFaqs = useMemo(() => {
    if (!query.trim()) return faqs.map((x, i) => ({ ...x, id: toId(x.q, i), idx: i }));
    const ql = query.toLowerCase();
    return faqs
      .map((x, i) => ({ ...x, id: toId(x.q, i), idx: i }))
      .filter(({ q, a }) => (q + ' ' + a).toLowerCase().includes(ql));
  }, [query]);

  // Otwórz akordeon z hasha (#q0, #q1, …)
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash || '').replace('#', '');
    if (hash) setForceOpenId(hash);
  
  try {
    if (window.plausible) window.plausible('faq_view');
  } catch {}
}, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Najczęstsze pytania (FAQ)</h1>
      <p className="text-gray-600 mb-6">
        Masz pytanie? Sprawdź odpowiedź poniżej. Jeśli nie znajdziesz tego, czego szukasz,
        odwiedź sekcję <a href="/kontakt" className="underline">Kontakt</a>.
      </p>

      {/* JSON-LD dla SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Wyszukiwarka w FAQ */}
      <input
        className="border px-3 py-2 rounded-lg mb-4 w-full"
        placeholder="Szukaj w FAQ…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Szukaj w FAQ"
      />

      {/* Lista pytań */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 && (
          <div className="text-gray-500">Brak wyników dla: <b>{query}</b></div>
        )}
        {filteredFaqs.map(({ q, a, id }, i) => (
          <AccordionItem
            key={id}
            id={id}
            q={q}
            a={a}
            defaultOpen={forceOpenId === id}
            onToggle={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
