import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import theme from './theme';

// Import names must match the file names EXACTLY (upper/lower case).
import Header from './components/header';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import PeopleMe from './components/PeopleMe';
import Research from './components/Research';
import Publications from './components/Publications';
import BeyondTheBench from './components/BeyondTheBench';

// Jump to the top whenever the page changes
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Header />

        <main className="flex-grow" style={{ fontFamily: theme.fonts.body }}>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* must match the links in header.jsx */}
            <Route path="/dr-ferrocene" element={<About />} />
            <Route path="/people" element={<PeopleMe />} />
            <Route path="/research" element={<Research />} />
            <Route path="/publications" element={<Publications />} />
            <Route path="/beyond-the-bench" element={<BeyondTheBench />} />

            {/* old /about link still works */}
            <Route path="/about" element={<Navigate to="/dr-ferrocene" replace />} />

            {/* any other URL goes back to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;