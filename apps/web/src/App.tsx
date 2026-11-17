import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home.js';
import { Editor } from './pages/Editor.js';
import { RenderPage } from './pages/Render.js';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route: /render/:id
  const renderMatch = currentPath.match(/^\/render\/([^/]+)/);
  if (renderMatch) {
    const resumeId = renderMatch[1];
    return <RenderPage resumeId={resumeId} />;
  }

  // Route: /r/:id/edit
  const editMatch = currentPath.match(/^\/r\/([^/]+)/);
  if (editMatch) {
    const resumeId = editMatch[1];
    return <Editor resumeId={resumeId} onNavigateHome={() => navigateTo('/')} />;
  }

  // Default: Home
  return <Home onOpenResume={(id) => navigateTo(`/r/${id}/edit`)} />;
};
