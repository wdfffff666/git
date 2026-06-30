import React, { useState, useCallback } from 'react'
import { AppSettings } from '../../App'

interface SettingsProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
  onClose: () => void
}

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (推荐)' },
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 (最强)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (快速)' },
  { value: 'claude-fable-5', label: 'Claude Fable 5' }
]

export default function Settings({ settings, onSave, onClose }: SettingsProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = useCallback((key: keyof AppSettings, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(() => {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [form, onSave])

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="settings-header">
          <h2>⚙️ 设置</h2>
          <button className="topbar-btn" onClick={onClose}>✕</button>
        </div>

        {/* 内容 */}
        <div className="settings-body">
          {/* API 密钥 */}
          <div className="settings-group">
            <label>🔑 API 密钥</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={e => handleChange('apiKey', e.target.value)}
                placeholder="sk-ant-api03-... 或中转服务密钥"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKey(!showKey)}
                style={{ flexShrink: 0 }}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              支持 Anthropic 官方 Key 或中转服务 Key
            </div>
          </div>

          {/* CC Switch / 中转服务 */}
          <div className="settings-group" style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            border: form.useProxy ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.useProxy}
                onChange={e => handleChange('useProxy', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
              />
              🔄 启用中转服务 (CC Switch / API 代理)
            </label>
            {form.useProxy && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  自定义 API 端点地址
                </label>
                <input
                  type="text"
                  value={form.baseURL}
                  onChange={e => handleChange('baseURL', e.target.value)}
                  placeholder="例如: http://127.0.0.1:8800 或 https://your-relay.com/v1"
                  style={{ marginTop: 4 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>
                  <div>💡 <b>常见配置：</b></div>
                  <div>• CC Switch 默认：<code style={{color:'var(--accent-secondary)'}}>http://127.0.0.1:8800</code></div>
                  <div>• 其他中转：填入服务商提供的 API 地址</div>
                  <div>• API Key 填中转服务提供的密钥即可</div>
                </div>
              </div>
            )}
          </div>

          {/* 模型选择 */}
          <div className="settings-group">
            <label>🤖 模型</label>
            <select
              value={form.model}
              onChange={e => handleChange('model', e.target.value)}
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 最大 Token */}
          <div className="settings-group">
            <label>📏 最大输出长度 (Max Tokens)</label>
            <input
              type="number"
              value={form.maxTokens}
              onChange={e => handleChange('maxTokens', parseInt(e.target.value) || 4096)}
              min={256}
              max={32000}
              step={256}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              范围: 256-32000，越大回答越长但消耗更多
            </div>
          </div>

          {/* 温度 */}
          <div className="settings-group">
            <label>🌡️ 创造性 (Temperature): {form.temperature}</label>
            <input
              type="range"
              value={form.temperature}
              onChange={e => handleChange('temperature', parseFloat(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>0 - 精确</span>
              <span>1 - 创造</span>
            </div>
          </div>

          {/* 系统提示词 */}
          <div className="settings-group">
            <label>📋 系统提示词</label>
            <textarea
              value={form.systemPrompt}
              onChange={e => handleChange('systemPrompt', e.target.value)}
              rows={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>

          {/* 工作区 */}
          <div className="settings-group">
            <label>📁 工作区路径</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={form.workspacePath}
                onChange={e => handleChange('workspacePath', e.target.value)}
                placeholder="选择项目文件夹..."
                style={{ flex: 1 }}
                readOnly
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  if (window.electronAPI) {
                    const dir = await window.electronAPI.selectDirectory()
                    if (dir) handleChange('workspacePath', dir)
                  }
                }}
                style={{ flexShrink: 0 }}
              >
                浏览...
              </button>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? '✅ 已保存' : '💾 保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
