import React, { useState } from 'react';
import axios from 'axios';

export default function Kontakt() {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' }); // website = honeypot
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState({ loading: false, ok: null, msg: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ loading: false, ok: false, msg: 'Uzupełnij wszystkie wymagane pola.' });
      return;
    }
    if (!consent) {
      setStatus({ loading: false, ok: false, msg: 'Zaznacz zgodę na przetwarzanie danych.' });
      return;
    }
    setStatus({ loading: true, ok: null, msg: '' });
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/contact`, {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        website: form.website // honeypot
      });
      setStatus({ loading: false, ok: true, msg: 'Dziękujemy! Wiadomość została wysłana.' });
      setForm({ name: '', email: '', message: '', website: '' });
      setConsent(false);
    } catch (err) {
      setStatus({ loading: false, ok: false, msg: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' });
      // opcjonalnie: console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Kontakt</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Imię i nazwisko *</label>
          <input name="name" value={form.name} onChange={onChange}
                 className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">E-mail *</label>
          <input type="email" name="email" value={form.email} onChange={onChange}
                 className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Wiadomość *</label>
          <textarea name="message" value={form.message} onChange={onChange} rows="6"
                    className="w-full border rounded-lg px-3 py-2" required />
        </div>

        {/* Honeypot (ukryte pole) */}
        <div className="hidden">
          <label>Website</label>
          <input name="website" value={form.website} onChange={onChange} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={() => setConsent(!consent)} />
          <span>
            Wyrażam zgodę na przetwarzanie moich danych w celu obsługi zapytania.
            Zapoznałem/am się z <a href="/polityka-prywatnosci" className="underline">Polityką prywatności</a>.
          </span>
        </label>

        <button type="submit" disabled={status.loading}
                className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg disabled:bg-blue-300">
          {status.loading ? 'Wysyłanie…' : 'Wyślij'}
        </button>

        {status.ok === true && <p className="text-green-600">{status.msg}</p>}
        {status.ok === false && <p className="text-red-600">{status.msg}</p>}
      </form>
    </div>
  );
}
