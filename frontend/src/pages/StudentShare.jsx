import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const StudentShare = () => {
  const [profile, setProfile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [shareStats, setShareStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [renderedContent, setRenderedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, templatesRes, statsRes] = await Promise.all([
        studentAPI.getProfile(),
        studentAPI.getTemplates(),
        studentAPI.getShareStats()
      ]);
      setProfile(profileRes.data.data);
      setTemplates(templatesRes.data.data.templates);
      setShareStats(statsRes.data.data.stats);
      setError(null);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.response?.data?.error || 'Failed to load sharing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    try {
      const response = await studentAPI.renderTemplate(template.id, {});
      setRenderedContent(response.data.data.rendered);
    } catch (error) {
      console.error('Failed to render template:', error);
    }
  };

  const handleShare = async (platform) => {
    try {
      await studentAPI.logShare(platform, selectedTemplate?.id);

      const baseUrl = `${window.location.origin}/register?ref=${profile.referralCode}`;
      const message = renderedContent?.content || `Join me on this amazing platform! ${baseUrl}`;

      const shareUrls = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(message)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`,
        email: `mailto:?subject=${encodeURIComponent(renderedContent?.subject || 'Join me!')}&body=${encodeURIComponent(message)}`
      };

      if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      }

      loadData(); // Refresh stats
    } catch (error) {
      console.error('Failed to log share:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      whatsapp: '💬',
      telegram: '✈️',
      twitter: '🐦',
      facebook: '👥',
      linkedin: '💼',
      email: '📧'
    };
    return icons[platform] || '🔗';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        <div className="spin" style={{ fontSize: '4rem' }}>⏳</div>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)'
      }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>⚠️</div>
          <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-md)', fontWeight: '600' }}>
            Unable to Load
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadData} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${profile?.referralCode}`;

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-md)' }}>
      {/* Header */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="fade-in" style={{ maxWidth: '800px' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            Share & Grow
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            Share your referral link on social media, messaging apps, and email
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {shareStats && (
        <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            <div className="fade-in-up delay-100" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 'var(--space-xl)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--text-5xl)', fontWeight: '700', marginBottom: 'var(--space-sm)' }}>
                {shareStats.total_shares || 0}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Total Shares
              </div>
            </div>

            <div className="fade-in-up delay-200" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 'var(--space-xl)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--text-5xl)', fontWeight: '700', marginBottom: 'var(--space-sm)' }}>
                {shareStats.platforms_used || 0}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Platforms Used
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Link Card */}
      <div className="container-narrow" style={{ marginBottom: 'var(--space-3xl)' }}>
        <Card className="fade-in-up delay-100">
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-md)',
            fontWeight: '600'
          }}>
            Your Referral Link
          </h2>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: 'var(--space-lg)'
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 'var(--text-base)',
              wordBreak: 'break-all',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-md)'
            }}>
              {referralLink}
            </div>
            <Button onClick={() => copyToClipboard(referralLink)} variant="secondary" fullWidth>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </Button>
          </div>

          <h3 style={{
            fontSize: 'var(--text-lg)',
            marginBottom: 'var(--space-md)',
            fontWeight: '500',
            color: 'var(--text-muted)'
          }}>
            Quick Share
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 'var(--space-md)'
          }}>
            {['whatsapp', 'telegram', 'twitter', 'facebook', 'linkedin', 'email'].map((platform) => (
              <button
                key={platform}
                onClick={() => handleShare(platform)}
                style={{
                  padding: 'var(--space-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-xs)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'var(--primary-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span style={{ fontSize: '2rem' }}>{getPlatformIcon(platform)}</span>
                <span style={{ textTransform: 'capitalize' }}>{platform}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Message Templates */}
      <div className="container-narrow">
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          marginBottom: 'var(--space-xl)',
          fontWeight: '600'
        }}>
          Pre-written Templates
        </h2>

        {templates.length === 0 ? (
          <div className="fade-in-up" style={{
            textAlign: 'center',
            padding: 'var(--space-3xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📝</div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.6'
            }}>
              No templates available yet.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {templates.map((template, index) => (
              <div
                key={template.id}
                className={`fade-in-up delay-${Math.min(index * 100, 500)}`}
                style={{
                  background: selectedTemplate?.id === template.id
                    ? 'rgba(255, 215, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: selectedTemplate?.id === template.id
                    ? '1px solid var(--primary-gold)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  padding: 'var(--space-lg)',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id !== template.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onClick={() => handleSelectTemplate(template)}
              >
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--text-primary)'
                }}>
                  {template.name}
                </h3>

                <div style={{
                  display: 'inline-block',
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: 'rgba(var(--primary-gold-rgb), 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--primary-gold)',
                  textTransform: 'capitalize',
                  marginBottom: 'var(--space-md)'
                }}>
                  {template.template_type}
                </div>

                {template.subject && (
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <strong>Subject:</strong> {template.subject}
                  </div>
                )}

                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {template.content}
                </p>

                {template.usage_count > 0 && (
                  <div style={{
                    marginTop: 'var(--space-md)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-dimmed)'
                  }}>
                    Used {template.usage_count} times
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rendered Template Preview */}
        {renderedContent && (
          <Card className="fade-in-up" style={{ marginTop: 'var(--space-2xl)' }}>
            <h3 style={{
              fontSize: 'var(--text-xl)',
              marginBottom: 'var(--space-md)',
              fontWeight: '600'
            }}>
              Template Preview
            </h3>

            {renderedContent.subject && (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  Subject:
                </div>
                <div style={{
                  padding: 'var(--space-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-primary)'
                }}>
                  {renderedContent.subject}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-xs)'
              }}>
                Message:
              </div>
              <div style={{
                padding: 'var(--space-lg)',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {renderedContent.content}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => copyToClipboard(renderedContent.content)}
              fullWidth
            >
              {copied ? '✓ Copied!' : 'Copy Message'}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentShare;
