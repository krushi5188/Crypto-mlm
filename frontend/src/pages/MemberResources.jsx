import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: null,
    category: null,
    search: ''
  });
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resourcesRes, categoriesRes] = await Promise.all([
        studentAPI.getResources(filters),
        studentAPI.getResourceCategories()
      ]);
      setResources(resourcesRes.data.data.resources);
      setCategories(categoriesRes.data.data.categories);
      setError(null);
    } catch (error) {
      console.error('Failed to load resources:', error);
      setError(error.response?.data?.error || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResource = async (resource) => {
    setSelectedResource(resource);
    try {
      await studentAPI.getResource(resource.id);
    } catch (error) {
      console.error('Failed to log resource view:', error);
    }
  };

  const handleDownload = async (resourceId, fileUrl) => {
    try {
      await studentAPI.logDownload(resourceId);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Failed to log download:', error);
    }
  };

  const getResourceIcon = (type) => {
    const icons = {
      document: '📄',
      video: '🎥',
      image: '🖼️',
      link: '🔗',
      template: '📋'
    };
    return icons[type] || '📦';
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
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading resources...</p>
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
            Unable to Load Resources
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
            Training Resources
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            Access training materials, marketing templates, and valuable resources to grow your business
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container" style={{ marginBottom: 'var(--space-2xl)' }}>
        <Card className="fade-in-up delay-100">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Search */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: '500',
                color: 'var(--text-muted)'
              }}>
                Search Resources
              </label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-base)'
                }}
              />
            </div>

            {/* Type and Category Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--text-muted)'
                }}>
                  Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || null }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)'
                  }}
                >
                  <option value="">All Types</option>
                  <option value="document">Documents</option>
                  <option value="video">Videos</option>
                  <option value="image">Images</option>
                  <option value="link">Links</option>
                  <option value="template">Templates</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--text-muted)'
                }}>
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || null }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Resources Grid */}
      <div className="container">
        {resources.length === 0 ? (
          <div className="fade-in-up" style={{
            textAlign: 'center',
            padding: 'var(--space-3xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📚</div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.6'
            }}>
              No resources found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-xl)'
          }}>
            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className={`fade-in-up delay-${Math.min(index * 100, 500)}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: 'var(--space-lg)',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => handleViewResource(resource)}
              >
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
                  {getResourceIcon(resource.resource_type)}
                </div>

                <h3 style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--text-primary)'
                }}>
                  {resource.title}
                </h3>

                {resource.description && (
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-md)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {resource.description}
                  </p>
                )}

                {resource.category && (
                  <div style={{
                    display: 'inline-block',
                    padding: 'var(--space-xs) var(--space-sm)',
                    background: 'rgba(var(--primary-gold-rgb), 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--primary-gold)',
                    marginBottom: 'var(--space-md)'
                  }}>
                    {resource.category}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'var(--space-md)',
                  paddingTop: 'var(--space-md)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-dimmed)'
                }}>
                  <span>👁️ {resource.view_count} views</span>
                  <span>⬇️ {resource.download_count} downloads</span>
                </div>

                {resource.file_url && (
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(resource.id, resource.file_url);
                      }}
                    >
                      Download
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
            zIndex: 1000
          }}
          onClick={() => setSelectedResource(null)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
              {getResourceIcon(selectedResource.resource_type)}
            </div>

            <h2 style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: '600',
              marginBottom: 'var(--space-md)',
              color: 'var(--text-primary)'
            }}>
              {selectedResource.title}
            </h2>

            {selectedResource.description && (
              <p style={{
                color: 'var(--text-muted)',
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                marginBottom: 'var(--space-lg)'
              }}>
                {selectedResource.description}
              </p>
            )}

            {selectedResource.content && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-lg)',
                whiteSpace: 'pre-wrap',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
                {selectedResource.content}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
              {selectedResource.file_url && (
                <Button
                  variant="primary"
                  onClick={() => handleDownload(selectedResource.id, selectedResource.file_url)}
                  style={{ flex: 1 }}
                >
                  Download
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setSelectedResource(null)}
                style={{ flex: 1 }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResources;
