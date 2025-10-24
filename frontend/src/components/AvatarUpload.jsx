import React, { useState, useRef } from 'react';
import Avatar from './Avatar';

const AvatarUpload = ({
  currentAvatar,
  userName,
  onUpload,
  size = 'xl'
}) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      await onUpload(file);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to upload avatar');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-md)'
  };

  const uploadButtonStyle = {
    position: 'relative',
    cursor: uploading ? 'wait' : 'pointer',
    transition: 'all var(--transition-base)'
  };

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity var(--transition-base)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#ffffff'
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: uploading ? 'wait' : 'pointer',
    transition: 'all var(--transition-base)'
  };

  return (
    <div style={containerStyle}>
      <div
        style={uploadButtonStyle}
        onClick={handleClick}
        onMouseEnter={(e) => {
          const overlay = e.currentTarget.querySelector('.upload-overlay');
          if (overlay && !uploading) {
            overlay.style.opacity = '1';
          }
        }}
        onMouseLeave={(e) => {
          const overlay = e.currentTarget.querySelector('.upload-overlay');
          if (overlay) {
            overlay.style.opacity = '0';
          }
        }}
      >
        <Avatar
          src={preview || currentAvatar}
          name={userName}
          size={size}
        />
        <div className="upload-overlay" style={overlayStyle}>
          {uploading ? 'Uploading...' : 'Change Photo'}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        style={{
          ...buttonStyle,
          opacity: uploading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--glass-bg)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {uploading ? 'Uploading...' : 'Upload New Photo'}
      </button>

      {error && (
        <div style={{
          padding: '0.5rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#ef4444',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: '280px'
      }}>
        Recommended: Square image, at least 200x200px, max 5MB
      </p>
    </div>
  );
};

export default AvatarUpload;
