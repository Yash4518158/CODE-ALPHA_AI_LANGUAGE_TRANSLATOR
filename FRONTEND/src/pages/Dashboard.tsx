import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Languages, ArrowRightLeft, Copy, History, Trash2, LogOut, Loader2, Check, FileUp, Download, Eraser } from 'lucide-react';

interface Translation {
  id: number;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  created_at: string;
}

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic',
  'Bengali', 'Urdu', 'Indonesian', 'Turkish', 'Vietnamese', 'Thai'
];

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState<Translation[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/translations');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    setTranslatedText('');
    
    try {
      const response = await api.post('/api/translate', {
        source_language: sourceLang,
        target_language: targetLang,
        text: sourceText
      });
      setTranslatedText(response.data.translated_text);
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error("Translation failed", err);
      setTranslatedText("Error: Translation service unavailable. Please try again later.");
    } finally {
      setIsTranslating(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTranslating(true);
    setSourceText("Extracting text from document...");
    setTranslatedText('');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_language", sourceLang);
    formData.append("target_language", targetLang);

    try {
      const response = await api.post('/api/translate/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSourceText(response.data.source_text);
      setTranslatedText(response.data.translated_text);
      fetchHistory();
    } catch (err: any) {
      console.error("Document upload failed", err);
      setSourceText("");
      setTranslatedText(err.response?.data?.detail || "Error processing document file.");
    } finally {
      setIsTranslating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
  };

  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${targetLang.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await api.delete(`/api/translations/${id}`);
      setHistory(history.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      
      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              <Languages color="white" />
            </div>
            <h1>AI Translator</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Welcome, {user?.username}</span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>From</label>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} style={{ width: '100%' }}>
                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
            
            <button onClick={handleSwapLanguages} className="btn btn-secondary" style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: '50%' }} title="Swap Languages">
              <ArrowRightLeft size={20} />
            </button>
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>To</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{ width: '100%' }}>
                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
          </div>

          {/* Text Areas */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea 
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                style={{ height: '200px', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{sourceText.length} characters</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={handleClear}
                    className="btn btn-secondary" 
                    disabled={!sourceText.trim() || isTranslating}
                    title="Clear text"
                  >
                    <Eraser size={18} />
                  </button>
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary" 
                    disabled={isTranslating}
                    title="Upload Document (.pdf, .docx, .txt)"
                  >
                    <FileUp size={18} />
                  </button>
                  <button 
                    onClick={handleTranslate} 
                    className="btn btn-primary" 
                    disabled={!sourceText.trim() || isTranslating}
                  >
                    {isTranslating ? <><Loader2 size={18} className="animate-pulse" /> Translating...</> : 'Translate'}
                  </button>
                </div>
              </div>
            </div>
            {/* Target Language Box */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea 
                placeholder="Translation will appear here..." 
                value={translatedText}
                readOnly
                style={{ height: '200px', resize: 'none', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {translatedText && (
                  <button 
                    onClick={handleDownload}
                    className="btn btn-secondary"
                    title="Download translation"
                  >
                    <Download size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleCopy(translatedText)}
                  className="btn btn-secondary"
                  disabled={!translatedText}
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* Sidebar for History */}
      <aside style={{ width: '350px', borderLeft: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History size={20} color="var(--accent-primary)" />
          <h3 style={{ margin: 0 }}>History</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No translations yet.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <span>{item.source_language} → {item.target_language}</span>
                  <button onClick={() => handleDeleteHistory(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                  {item.source_text.length > 50 ? item.source_text.substring(0, 50) + '...' : item.source_text}
                </div>
                <div style={{ color: 'var(--accent-secondary)' }}>
                  {item.translated_text.length > 50 ? item.translated_text.substring(0, 50) + '...' : item.translated_text}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

    </div>
  );
};
