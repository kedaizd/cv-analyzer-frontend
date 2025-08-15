import React, { useState } from 'react';
import axios from 'axios';

export default function StarCoach() {
  const [form, setForm] = useState({
    situation: '',
    task: '',
    action: '',
    result: '',
    role: '',
    language: 'pl',
    tone: 'concise',
    plan: 'free'
  });
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [error, setError] = useState('');

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResp(null);
    try {
      const r = await axios.post(`${import.meta.env.VITE_API_URL}/api/star-coach`, form, {
        headers: { 'Content-Type': 'application/json' }
      });
      setResp(r.data.star);
      try {
        if (window.plausible) window.plausible('star_coached', {
          props: {
            grade: r?.data?.star?.grade ?? 'N/A',
            length: r?.data?.star?.length_chars ?? 0,
            metrics_score: r?.data?.star?.scores?.metrics ?? 0
          }
        });
      } catch {}
    } catch (err) {
      setError('Nie udało się wygenerować odpowiedzi. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(resp?.answer || '');
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Coach odpowiedzi STAR (ekspres)</h1>
      <p className="text-gray-600 mb-6">
        Wypełnij pola S/T/A/R. Otrzymasz krótką, dopracowaną odpowiedź + feedback i ocenę.
      </p>

      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="font-semibold">Sytuacja (S)</label>
          <textarea name="situation" value={form.situation} onChange={onChange}
            className="w-full border rounded-lg px-3 py-2" rows="3"
            placeholder="Kontekst: gdzie pracowałeś, jaki był stan wyjściowy..." />
        </div>
        <div>
          <label className="font-semibold">Zadanie (T)</label>
          <textarea name="task" value={form.task} onChange={onChange}
            className="w-full border rounded-lg px-3 py-2" rows="2"
            placeholder="Co było celem / Twoją odpowiedzialnością..." />
        </div>
        <div>
          <label className="font-semibold">Akcja (A)</label>
          <textarea name="action" value={form.action} onChange={onChange}
            className="w-full border rounded-lg px-3 py-2" rows="3"
            placeholder="Jakie konkretne kroki podjąłeś (narzędzia, decyzje, współpraca)..." />
        </div>
        <div>
          <label className="font-semibold">Rezultat (R)</label>
          <textarea name="result" value={form.result} onChange={onChange}
            className="w-full border rounded-lg px-3 py-2" rows="2"
            placeholder="Efekt działań (liczby/KPI, czas, jakość, oszczędności)..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold">Kontekst roli (opcjonalnie)</label>
            <input name="role" value={form.role} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2" placeholder="Nazwa roli/stanowiska" />
          </div>
          <div>
            <label className="font-semibold">Język</label>
            <select name="language" value={form.language} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2">
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">Styl</label>
            <select name="tone" value={form.tone} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2">
              <option value="concise">Zwięźle</option>
              <option value="professional">Profesjonalnie</option>
              <option value="enthusiastic">Energicznie</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Tip: rezultat z liczbami/KPI zwykle podnosi ocenę.
          </div>
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg disabled:bg-blue-300">
            {loading ? 'Generuję…' : 'Generuj odpowiedź'}
          </button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
      </form>

      {resp && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Twoja odpowiedź STAR</h2>
            <button onClick={copyAnswer} className="text-sm underline">Kopiuj</button>
          </div>
          <p className="whitespace-pre-wrap">{resp.answer}</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Feedback</h3>
              <ul className="list-disc list-inside text-gray-700">
                {resp.feedback?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              {resp.tips?.length > 0 && (
                <>
                  <h3 className="font-semibold mt-3 mb-1">Jak podnieść ocenę</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {resp.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </>
              )}
              {resp.red_flags?.length > 0 && (
                <>
                  <h3 className="font-semibold mt-3 mb-1">Ryzyka / braki</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {resp.red_flags.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ocena</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{resp.grade}</span>
                <span className="text-gray-500 text-sm">{resp.length_chars} znaków</span>
              </div>
              <div className="mt-3 space-y-2">
                {Object.entries(resp.scores || {}).map(([k,v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{k}</span><span>{v}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded">
                      <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
