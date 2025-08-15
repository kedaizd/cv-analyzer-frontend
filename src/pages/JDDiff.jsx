import React, { useMemo, useState } from 'react';
import axios from 'axios';

export default function JDDiff() {
  // UI state
  const [mode, setMode] = useState('links'); // 'links' | 'text'
  const [cvFile, setCvFile] = useState(null);

  // Links mode
  const [jobUrls, setJobUrls] = useState('');

  // Text mode
  const [jdTextBlock, setJdTextBlock] = useState('');
  const [jdLabels, setJdLabels] = useState('');

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [error, setError] = useState('');

  const parseLines = (raw) => String(raw||'').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  // W text-mode: rozdzielamy ogłoszenia blokerami "---"
  const parseTextJobs = (raw) => String(raw||'')
    .split(/\n-{3,}\n/g) // blok oddzielony linią z wieloma minusami
    .map(s => s.trim())
    .filter(Boolean);

  const FitBadge = ({ v }) => {
    if (v === null || v === undefined) return <span className="px-2 py-1 text-xs bg-gray-200 rounded">brak CV</span>;
    const color = v >= 70 ? 'bg-green-100 text-green-700'
               : v >= 40 ? 'bg-yellow-100 text-yellow-700'
               : 'bg-red-100 text-red-700';
    return <span className={`px-2 py-1 text-xs rounded ${color}`}>{v}%</span>;
  };

  // CSV: budujemy macierz Wymaganie × Ogłoszenie
  const csvData = useMemo(() => {
    if (!resp?.diff?.requirements_by_job) return null;
    const jobs = resp.diff.requirements_by_job; // [{id,label,requirements},...]
    const allReqsSet = new Set();
    jobs.forEach(j => j.requirements.forEach(r => allReqsSet.add(r)));
    const allReqs = Array.from(allReqsSet);

    // Nagłówek: "Wymaganie", ...etykiety JD...
    const header = ['Wymaganie', ...jobs.map(j => j.label)];

    // Wiersze: 1 jeśli wymaganie w JD, inaczej 0
    const rows = allReqs.map(req => {
      const presence = jobs.map(j => (j.requirements.includes(req) ? 1 : 0));
      return [req, ...presence];
    });

    // Budujemy CSV
    const escape = (v) => {
      const s = String(v ?? '');
      if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [header, ...rows].map(row => row.map(escape).join(','));
    const csv = lines.join('\n');
    return { csv, header, rows };
  }, [resp]);

  const copyCSV = async () => {
    if (!csvData?.csv) return;
    try { await navigator.clipboard.writeText(csvData.csv); } catch {}
  };

  const downloadCSV = () => {
    if (!csvData?.csv) return;
    const blob = new Blob([csvData.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jd_diff.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setResp(null);

    try {
      setLoading(true);

      if (mode === 'links') {
        const urls = parseLines(jobUrls);
        if (urls.length < 2 || urls.length > 5) {
          setError('Podaj od 2 do 5 linków do ogłoszeń (po jednym w linii).');
          setLoading(false); return;
        }
        const form = new FormData();
        if (cvFile) form.append('cv', cvFile);
        form.append('jobUrls', JSON.stringify(urls));

        const r = await axios.post(`${import.meta.env.VITE_API_URL}/api/jd-diff`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResp(r.data);
        try { if (window.plausible) window.plausible('jd_diff_run', { props: { jobs: urls.length, with_cv: cvFile ? '1' : '0', mode: 'links' } }); } catch {}
      } else {
        const jdTexts = parseTextJobs(jdTextBlock);
        if (jdTexts.length < 2 || jdTexts.length > 5) {
          setError('W trybie tekstowym wklej 2–5 bloków ogłoszeń rozdzielonych linią z „---”.');
          setLoading(false); return;
        }
        const labels = parseLines(jdLabels);
        // labels opcjonalne; mogą być krótsze niż liczba JD
        const payload = { jdTexts, labels };
        // w text-mode nie obsługujemy uploadu CV; można dodać "cvText" pole:
        // payload.cvText = '...'; // jeśli chcesz porównywać bez pliku

        const r = await axios.post(`${import.meta.env.VITE_API_URL}/api/jd-diff-from-text`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        setResp(r.data);
        try { if (window.plausible) window.plausible('jd_diff_run', { props: { jobs: jdTexts.length, with_cv: '0', mode: 'text' } }); } catch {}
      }
    } catch (err) {
      setError('Nie udało się porównać ogłoszeń. Sprawdź dane i spróbuj ponownie.');
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Porównywarka ogłoszeń (JD diff)</h1>
      <p className="text-gray-600 mb-6">
        Porównaj 2–5 ogłoszeń: wymagania wspólne/unikalne + dopasowanie CV (w trybie linków).
      </p>

      {/* Tryb wyboru */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded ${mode==='links'?'bg-blue-600 text-white':'bg-gray-200'}`}
          onClick={()=>setMode('links')}
          type="button"
        >
          Z linków
        </button>
        <button
          className={`px-3 py-1 rounded ${mode==='text'?'bg-blue-600 text-white':'bg-gray-200'}`}
          onClick={()=>setMode('text')}
          type="button"
        >
          Z wklejonego tekstu
        </button>
      </div>

      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow space-y-4">
        {mode === 'links' ? (
          <>
            <div>
              <label className="font-semibold">Linki do ogłoszeń (po jednym w linii)</label>
              <textarea
                value={jobUrls}
                onChange={(e)=>setJobUrls(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="https://...\nhttps://..."
              />
            </div>
            <div>
              <label className="font-semibold">CV (opcjonalnie, PDF/DOCX)</label>
              <input type="file" accept=".pdf,.docx" onChange={(e)=>setCvFile(e.target.files[0]||null)} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="font-semibold">Treści ogłoszeń</label>
              <textarea
                value={jdTextBlock}
                onChange={(e)=>setJdTextBlock(e.target.value)}
                rows={10}
                className="w-full border rounded-lg px-3 py-2"
                placeholder={`Wklej ogłoszenie #1...
---
Wklej ogłoszenie #2...
---
(ewentualnie #3, #4, #5)`}
              />
              <p className="text-xs text-gray-500 mt-1">Oddziel ogłoszenia linią zawierającą trzy lub więcej minusów (---).</p>
            </div>
            <div>
              <label className="font-semibold">Etykiety (opcjonalnie, po jednej w linii)</label>
              <textarea
                value={jdLabels}
                onChange={(e)=>setJdLabels(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
                placeholder={`Firma A – DevOps
Firma B – SRE`}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg disabled:bg-blue-300">
          {loading ? 'Porównuję…' : 'Porównaj ogłoszenia'}
        </button>
        {error && <div className="text-red-600">{error}</div>}
      </form>

      {resp?.diff && (
        <div className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Wspólne wymagania ({resp.diff.common_requirements.length})</h2>
            {resp.diff.common_requirements.length ? (
              <ul className="list-disc list-inside">
                {resp.diff.common_requirements.map((r,i)=> <li key={i}>{r}</li>)}
              </ul>
            ) : <p className="text-gray-600">Brak wspólnych wymagań.</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Unikalne wymagania per ogłoszenie</h2>
            <div className="space-y-4">
              {Object.entries(resp.diff.unique_by_job).map(([labelOrUrl, list]) => (
                <div key={labelOrUrl}>
                  <div className="font-semibold break-all">{labelOrUrl}</div>
                  {list.length ? (
                    <ul className="list-disc list-inside">
                      {list.map((r,i)=> <li key={i}>{r}</li>)}
                    </ul>
                  ) : <p className="text-gray-600">Brak wyraźnie unikalnych wymagań.</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold mb-2">Dopasowanie CV → każde ogłoszenie</h2>
              <div className="flex gap-2">
                <button onClick={copyCSV} disabled={!csvData} className="px-3 py-1 rounded bg-gray-200">Kopiuj CSV</button>
                <button onClick={downloadCSV} disabled={!csvData} className="px-3 py-1 rounded bg-gray-200">Pobierz CSV</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Ogłoszenie</th>
                    <th className="py-2 pr-4">Wymagań (liczba)</th>
                    <th className="py-2 pr-4">Fit</th>
                    <th className="py-2">Braki (top 5)</th>
                  </tr>
                </thead>
                <tbody>
                  {resp.diff.per_job.map((row, idx) => (
                    <tr key={row.url || row.label || idx} className="border-b align-top">
                      <td className="py-2 pr-4 break-all">{row.url || row.label}</td>
                      <td className="py-2 pr-4">{row.total_requirements}</td>
                      <td className="py-2 pr-4"><FitBadge v={row.fit_score} /></td>
                      <td className="py-2">
                        {row.fit_score === null ? (
                          <span className="text-gray-500">Prześlij CV (tryb linków), aby zobaczyć braki.</span>
                        ) : row.top_missing.length ? (
                          <ul className="list-disc list-inside">
                            {row.top_missing.map((m,i)=> <li key={i}>{m}</li>)}
                          </ul>
                        ) : <span className="text-green-700">Brak oczywistych braków na podstawie słów kluczowych.</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Podgląd: słowa kluczowe */}
            {resp?.diff?.jd_keywords?.length ? (
              <p className="text-xs text-gray-500 mt-3">Słowa kluczowe ogółem (podgląd): {resp.diff.jd_keywords.slice(0,20).join(', ')}…</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}