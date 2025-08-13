// app.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INDUSTRIES = [
  'IT',
  'Finanse',
  'Marketing',
  'Sprzedaż',
  'HR',
  'Logistyka',
  'Inżynieria',
  'Prawo',
  'Zdrowie',
  'Edukacja',
  'Consulting',
  'Inne'
];

const App = () => {
  const [cvFile, setCvFile] = useState(null);
  const [jobUrl, setJobUrl] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [plan, setPlan] = useState('free');

  // NEW: branże
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [autoIndustryDetected, setAutoIndustryDetected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    setHistory(saved);
  }, []);

  const handleFileChange = (e) => {
    setCvFile(e.target.files[0]);
  };

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 1000) {
      setError(`Opis przekracza limit 1000 słów (aktualnie: ${wordCount})`);
    } else {
      setError('');
      setAdditionalDescription(text);
    }
  };

  const detectIndustry = async (urls) => {
    try {
      const response = await axios.post(`${API_BASE}/api/detect-industry`, { jobUrls: urls });
      const detected = response.data?.industry || '';
      if (detected && INDUSTRIES.includes(detected)) {
        setSelectedIndustry(detected);
        setAutoIndustryDetected(true);
        return detected;
      }
      return '';
    } catch (err) {
      console.warn('Nie udało się wykryć branży automatycznie.', err?.response?.data || err.message);
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const urls = jobUrl.split('\n').map((u) => u.trim()).filter(Boolean);

    if (!cvFile || urls.length === 0) {
      setError('Proszę przesłać plik CV i podać link lub linki do ogłoszeń.');
      return;
    }
    if (plan === 'free' && urls.length > 1) {
      setError('W darmowym planie możesz przeanalizować tylko 1 ogłoszenie.');
      return;
    }
    if (plan === 'pro' && urls.length > 5) {
      setError('W planie Premium możesz przeanalizować maksymalnie 5 ogłoszeń.');
      return;
    }

    const wordCount = additionalDescription.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 1000) {
      setError(`Opis przekracza limit 1000 słów (aktualnie: ${wordCount})`);
      return;
    }

    let industryToSend = selectedIndustry;
    if (!industryToSend) {
      industryToSend = await detectIndustry(urls);
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('urls', urls.join('\n'));
    formData.append('plan', plan);
    formData.append('additionalDescription', additionalDescription);
    formData.append('selectedIndustry', industryToSend || '');

    try {
      const response = await axios.post(
        `${API_BASE}/api/analyze-cv-multiple`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setResult(response.data.analysis);

      const existingHistory = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      const newEntry = {
        date: new Date().toISOString(),
        plan,
        selectedIndustry: industryToSend || selectedIndustry || '',
        results: response.data.analysis
      };
      const updatedHistory = [newEntry, ...existingHistory];
      localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.message || 'Wystąpił błąd podczas analizy.';
      const details = err?.response?.data?.details || err?.response?.data?.hint;
      setError([msg, details].filter(Boolean).join(' — '));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Analizator CV</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        {/* Pozostała część formularza bez zmian */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Wybierz plik CV (PDF lub DOCX)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="w-full text-gray-700"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="jobUrls" className="block text-gray-700 font-bold mb-2">
            Linki do ogłoszeń o pracę (po jednym w każdej linii)
          </label>
          <textarea
            id="jobUrls"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://...\nhttps://..."
            rows="4"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="selectedIndustry" className="block text-gray-700 font-bold mb-2">
            Wybór branży (opcjonalnie)
          </label>
          <select
            id="selectedIndustry"
            value={selectedIndustry}
            onChange={(e) => {
              setSelectedIndustry(e.target.value);
              setAutoIndustryDetected(false);
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Bez wskazania branży —</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          {autoIndustryDetected && (
            <p className="text-xs text-green-600 mt-1">
              Branża wykryta automatycznie na podstawie treści ogłoszenia.
            </p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="additionalDescription" className="block text-gray-700 font-bold mb-2">
            Dodatkowy opis do analizy (opcjonalny, max 1000 słów)
          </label>
          <textarea
            id="additionalDescription"
            value={additionalDescription}
            onChange={handleDescriptionChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Opisz dodatkowe informacje, które LLM powinien uwzględnić..."
            rows="5"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="plan" className="block text-gray-700 font-bold mb-2">
            Wybierz plan
          </label>
          <select
            id="plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="free">Darmowy (1 ogłoszenie)</option>
            <option value="pro">Premium (do 5 ogłoszeń)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex justify-center items-center"
        >
          {loading && <FaSpinner className="animate-spin mr-2" />}
          {loading ? 'Analizuję...' : 'Wyślij do analizy'}
        </button>
      </form>
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

      {/* START: DODANO SEKCJĘ WYŚWIETLANIA WYNIKÓW */}
      {result && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Wyniki analizy</h2>
          
          {/* Podsumowanie */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Podsumowanie</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{result.podsumowanie}</p>
          </div>

          {/* Dopasowanie */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Dopasowanie</h3>
            <p className="text-gray-700">Dopasowanie do ogłoszenia: <span className="font-bold">{result.dopasowanie_procentowe}%</span></p>
            <div className="mt-4">
              <h4 className="font-bold text-green-700 mb-1 flex items-center">
                <FaCheckCircle className="mr-2" /> Mocne strony
              </h4>
              <ul className="list-disc list-inside text-gray-700 pl-4">
                {result.dopasowanie.mocne_strony.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-red-700 mb-1 flex items-center">
                <FaTimesCircle className="mr-2" /> Obszary do poprawy
              </h4>
              <ul className="list-disc list-inside text-gray-700 pl-4">
                {result.dopasowanie.obszary_do_poprawy.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pytania */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Pytania na rozmowę kwalifikacyjną</h3>
            <div className="mt-4">
              <h4 className="font-bold text-gray-700 mb-1">Kompetencje miękkie</h4>
              <ul className="list-decimal list-inside text-gray-700 pl-4">
                {result.pytania.kompetencje_miekkie.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-gray-700 mb-1">Kompetencje twarde</h4>
              <ul className="list-decimal list-inside text-gray-700 pl-4">
                {result.pytania.kompetencje_twarde.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
      {/* KONIEC: DODANO SEKCJĘ WYŚWIETLANIA WYNIKÓW */}

    </div>
  );
};

export default App;