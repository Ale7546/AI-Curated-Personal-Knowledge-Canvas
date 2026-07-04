import React, { useState, useEffect } from 'react';
import { checkOllamaStatus } from '../services/llmService';
import type { LLMConfig } from '../services/db';
import { Cpu, Cloud, Brain, Check, Eye, EyeOff, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LLMSelectorModalProps {
  onSave: (config: LLMConfig) => void;
  currentConfig?: LLMConfig;
  isClosable?: boolean;
  onClose?: () => void;
}

export const LLMSelectorModal: React.FC<LLMSelectorModalProps> = ({
  onSave,
  currentConfig,
  isClosable = false,
  onClose
}) => {
  const [provider, setProvider] = useState<'ollama' | 'gemini' | 'openai'>(
    currentConfig?.provider || 'ollama'
  );
  
  // Ollama states
  const [ollamaUrl, setOllamaUrl] = useState(currentConfig?.url || '/api/ollama');
  const [ollamaModel, setOllamaModel] = useState(currentConfig?.model || 'mistral');
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // API config states
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [cloudModel, setCloudModel] = useState(
    currentConfig?.model || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini')
  );

  const [error, setError] = useState('');

  // Automatically check Ollama status when Url changes
  useEffect(() => {
    if (provider === 'ollama') {
      const checkConnection = async () => {
        setCheckingStatus(true);
        const online = await checkOllamaStatus(ollamaUrl);
        setOllamaOnline(online);
        setCheckingStatus(false);
      };
      const debounceTimer = setTimeout(checkConnection, 600);
      return () => clearTimeout(debounceTimer);
    }
  }, [ollamaUrl, provider]);

  // Adjust default models when provider changes
  const handleProviderSelect = (selectedProvider: 'ollama' | 'gemini' | 'openai') => {
    setProvider(selectedProvider);
    setError('');
    if (selectedProvider === 'gemini') {
      setCloudModel(currentConfig?.model || 'gemini-1.5-flash');
    } else if (selectedProvider === 'openai') {
      setCloudModel(currentConfig?.model || 'gpt-4o-mini');
    } else {
      setOllamaModel(currentConfig?.model || 'mistral');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const newConfig: LLMConfig = {
      provider,
    };

    if (provider === 'ollama') {
      if (!ollamaUrl.trim()) {
        setError('Ollama API endpoint URL is required.');
        return;
      }
      newConfig.url = ollamaUrl.trim();
      newConfig.model = ollamaModel.trim() || 'mistral';
    } else {
      if (!apiKey.trim()) {
        setError(`${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key is required.`);
        return;
      }
      newConfig.apiKey = apiKey.trim();
      newConfig.model = cloudModel.trim();
    }

    onSave(newConfig);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel" onKeyDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Brain className="modal-brain-icon" />
            <h2 className="modal-title">Configure Your AI Brain</h2>
          </div>
          <p className="modal-subtitle">Choose the engine that generates connections and tags</p>
        </div>

        {/* Provider Cards */}
        <div className="provider-tiles">
          <button
            type="button"
            className={`provider-tile ${provider === 'ollama' ? 'selected' : ''}`}
            onClick={() => handleProviderSelect('ollama')}
          >
            <div className="provider-tile-header">
              <Cpu className="provider-icon" />
              {provider === 'ollama' && <Check className="provider-check-icon" />}
            </div>
            <span className="provider-tile-name">Local Ollama</span>
            <span className="provider-tile-desc">Mistral via Docker or Native Windows. Fully private and offline.</span>
          </button>

          <button
            type="button"
            className={`provider-tile ${provider === 'gemini' ? 'selected' : ''}`}
            onClick={() => handleProviderSelect('gemini')}
          >
            <div className="provider-tile-header">
              <Cloud className="provider-icon" />
              {provider === 'gemini' && <Check className="provider-check-icon" />}
            </div>
            <span className="provider-tile-name">Google Gemini</span>
            <span className="provider-tile-desc">Fast, cloud-based intelligence (Recommended: gemini-1.5-flash).</span>
          </button>

          <button
            type="button"
            className={`provider-tile ${provider === 'openai' ? 'selected' : ''}`}
            onClick={() => handleProviderSelect('openai')}
          >
            <div className="provider-tile-header">
              <Cloud className="provider-icon" />
              {provider === 'openai' && <Check className="provider-check-icon" />}
            </div>
            <span className="provider-tile-name">OpenAI GPT</span>
            <span className="provider-tile-desc">Standard GPT-4o-mini chat endpoints. Requires personal API Key.</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {error && (
            <div className="auth-error-block">
              <AlertTriangle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          {provider === 'ollama' ? (
            <div className="provider-fields">
              <div className="auth-input-group">
                <label className="auth-label">Ollama API Endpoint</label>
                <input
                  type="text"
                  className="node-input"
                  placeholder="e.g. /api/ollama or http://localhost:11434"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                />
                <span className="input-hint">
                  <Info className="icon-xs" /> Use the default <code>/api/ollama</code> proxy to bypass browser CORS blocks.
                </span>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Ollama Model Name</label>
                <input
                  type="text"
                  className="node-input"
                  placeholder="e.g. mistral"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                />
              </div>

              {/* Status Ping Indicator */}
              <div className="ollama-ping-status">
                {checkingStatus ? (
                  <span className="ping-text checking">🔮 Verifying Ollama endpoint...</span>
                ) : ollamaOnline === true ? (
                  <span className="ping-text success">
                    <ShieldCheck className="icon-sm" /> Connected! Mistral is active on this endpoint.
                  </span>
                ) : ollamaOnline === false ? (
                  <span className="ping-text warning">
                    <AlertTriangle className="icon-sm" /> Warning: Ollama appears offline. Make sure the container/application is running.
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="provider-fields">
              <div className="auth-input-group">
                <label className="auth-label">{provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="node-input auth-input"
                    placeholder={`Paste your secret ${provider.toUpperCase()} API key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-icon auth-input-icon-btn"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                  </button>
                </div>
                <span className="input-hint">
                  <Info className="icon-xs" /> API keys are stored only locally in your browser's IndexedDB and never sent to our servers.
                </span>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Model Endpoint</label>
                <input
                  type="text"
                  className="node-input"
                  placeholder={provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
                  value={cloudModel}
                  onChange={(e) => setCloudModel(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="modal-actions-row">
            {isClosable && onClose && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              Connect AI Brain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
