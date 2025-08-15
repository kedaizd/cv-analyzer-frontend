import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Analyzer from './pages/Analyzer';
import Regulamin from './pages/Regulamin';
import PolitykaPrywatnosci from './pages/PolitykaPrywatnosci';
import Kontakt from './pages/Kontakt';
import FAQ from './pages/FAQ';
import StarCoach from './pages/StarCoach';
import JDDiff from './pages/JDDiff';

const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <header className="border-b bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">Interview Prep</Link>
        <nav className="space-x-4 text-sm">
          <Link to="/" className="hover:underline">Analizator CV</Link>
          <Link to="/star" className="hover:underline">Coach STAR</Link>
          <Link to="/jd-diff" className="hover:underline">Porównywarka JD</Link>
          <Link to="/kontakt" className="hover:underline">Kontakt</Link>
          <Link to="/regulamin" className="hover:underline">Regulamin</Link>
          <Link to="/polityka-prywatnosci" className="hover:underline">Polityka prywatności</Link>
        </nav>
      </div>
    </header>

    <main className="flex-1 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
    </main>

    <footer className="border-t bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4 text-sm text-gray-600 flex flex-wrap gap-x-4">
        <span>© {new Date().getFullYear()} Interview Prep</span>
        <Link to="/star" className="hover:underline">Coach STAR</Link>
        <Link to="/jd-diff" className="hover:underline">Porównywarka JD</Link>
        <Link to="/kontakt" className="hover:underline">Kontakt</Link>
        <Link to="/faq" className="hover:underline">FAQ</Link>
        <Link to="/regulamin" className="hover:underline">Regulamin</Link>
        <Link to="/polityka-prywatnosci" className="hover:underline">Polityka prywatności</Link>
      </div>
    </footer>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Analyzer />} />
          <Route path="/star" element={<StarCoach />} />
          <Route path="/jd-diff" element={<JDDiff />} />
          <Route path="/kontakt" element={<Kontakt />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/regulamin" element={<Regulamin />} />
          <Route path="/polityka-prywatnosci" element={<PolitykaPrywatnosci />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
