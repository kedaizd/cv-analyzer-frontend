import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const INDUSTRIES = [
  'IT / Software',
  'Finanse / Księgowość',
  'Bankowość / Ubezpieczenia',
  'Analityka danych / BI',
  'Marketing / Digital',
  'Sprzedaż / Customer Success',
  'HR / Rekrutacja',
  'Logistyka / Operacje',
  'Produkcja / Inżynieria',
  'Zarządzanie projektami (PMO / PM)',
  'Inne'
];

const App = () => {
  const [cvFile, setCvFile] = useState(null);
  const [jobUrl, setJobUrl] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [plan, setPlan] = useState('free');
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

  const parseUrls = (raw) =>
    raw
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const urls = parseUrls(jobUrl);

    // Walidacje
    if (!cvFile) {
      setError('Proszę przesłać plik CV (PDF lub DOCX).');
      return;
    }
    if (urls.length === 0) {
      setError('Podaj co najmniej 1 link do ogłoszenia.');
      return;
    }
    if (plan === 'free' && urls.length > 1) {
      setError('W planie Darmowym możesz przeanalizować tylko 1 ogłoszenie.');
      return;
    }
    if (plan === 'pro' && urls.length > 5) {
      setError('W planie Premium możesz przeanalizować maksymalnie 5 ogłoszeń.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('jobUrls', JSON.stringify(urls));
    formData.append('plan', plan);
    formData.append('additionalDescription', additionalDescription || '');
    formData.append('selectedIndustry', selectedIndustry || '');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/analyze-cv-multiple`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setResult(response.data.analysis);

      // Zapis historii
      const existingHistory = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      const newEntry = {
        date: new Date().toISOString(),
        plan,
        selectedIndustry: selectedIndustry || '',
        results: response.data.analysis
      };
      const updatedHistory = [newEntry, ...existingHistory].slice(0, 20); // limit do 20 wpisów
      localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (err) {
      console.error(err);
      setError('Wystąpił błąd podczas analizy. Sprawdź konsolę serwera i konfigurację VITE_API_URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Analizator CV</h1>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Wybierz plik CV (PDF lub DOCX)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx"
            className="w-full text-gray-700"
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
          <p className="text-xs text-gray-500 mt-1">
            Darmowy plan: 1 ogłoszenie, Premium: do 5 ogłoszeń.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="selectedIndustry" className="block text-gray-700 font-bold mb-2">
            Branża (wpływa na prompt i pytania)
          </label>
          <select
            id="selectedIndustry"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— wybierz —</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Jeśli nie wybierzesz nic, analiza użyje ustawień domyślnych.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="additionalDescription" className="block text-gray-700 font-bold mb-2">
            Dodatkowy opis do analizy (opcjonalny, max 1000 słów)
          </label>
          <textarea
            id="additionalDescription"
            value={additionalDescription}
            onChange={(e) => setAdditionalDescription(e.target.value)}
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

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">Wyniki analizy</h2>

          {result?.dopasowanie_procentowe !== undefined && (
            <p className="mb-4 font-semibold">
              Dopasowanie: <span className="text-blue-600">{result.dopasowanie_procentowe}%</span>
            </p>
          )}

          {result?.podsumowanie && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Podsumowanie</h3>
              <p>{result.podsumowanie}</p>
            </div>
          )}

          {result?.dopasowanie && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Dopasowanie do ofert</h3>

              {Array.isArray(result.dopasowanie.mocne_strony) &&
                result.dopasowanie.mocne_strony.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-bold">Mocne strony:</h4>
                    <ul className="list-none">
                      {result.dopasowanie.mocne_strony.map((item, index) => (
                        <li key={index} className="flex items-center mb-1">
                          <FaCheckCircle className="text-green-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {Array.isArray(result.dopasowanie.obszary_do_poprawy) &&
                result.dopasowanie.obszary_do_poprawy.length > 0 && (
                  <div>
                    <h4 className="font-bold">Obszary do poprawy:</h4>
                    <ul className="list-none">
                      {result.dopasowanie.obszary_do_poprawy.map((item, index) => (
                        <li key={index} className="flex items-center mb-1">
                          <FaTimesCircle className="text-red-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {result?.pytania && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Pytania do rozmowy kwalifikacyjnej:</h3>

              <h4 className="font-bold text-lg">Kompetencje miękkie:</h4>
              <ul className="list-decimal list-inside">
                {Array.isArray(result.pytania.kompetencje_miekkie) &&
                result.pytania.kompetencje_miekkie.length > 0 ? (
                  result.pytania.kompetencje_miekkie.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>Brak pytań</li>
                )}
              </ul>

              <h4 className="font-bold text-lg mt-2">Kompetencje twarde:</h4>
              <ul className="list-decimal list-inside">
                {Array.isArray(result.pytania.kompetencje_twarde) &&
                result.pytania.kompetencje_twarde.length > 0 ? (
                  result.pytania.kompetencje_twarde.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>Brak pytań</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {Array.isArray(history) && history.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg mt-6">
          <h3 className="text-lg font-bold mb-2">Historia analiz</h3>
          {history.map((entry, i) => (
            <div key={i} className="mb-2 border-b pb-2">
              <p className="text-sm opacity-70">{new Date(entry.date).toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">Plan: <b>{entry.plan}</b></p>
              {entry.selectedIndustry && (
                <p className="mt-1 text-sm text-gray-500">Branża: <b>{entry.selectedIndustry}</b></p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Podsumowanie: <b>{entry.results?.podsumowanie?.substring(0, 80)}...</b>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
