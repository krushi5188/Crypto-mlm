import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Copy, CheckCircle, AlertCircle, ExternalLink,
  MessageSquare, Send, Mail, FileText, Sparkles, TrendingUp,
  Info
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp,
  scaleIn 
} from '../utils/animations';

const MemberShare = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [shareStats, setShareStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [renderedContent, setRenderedContent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, templatesRes, statsRes] = await Promise.all([
        memberAPI.getProfile(),
        memberAPI.getTemplates(),
        memberAPI.getShareStats()
      ]);
      setProfile(profileRes.data.data);
      setTemplates(templatesRes.data.data.templates);
      setShareStats(statsRes.data.data.stats);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load sharing data';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    try {
      const response = await memberAPI.renderTemplate(template.id, {});
      setRenderedContent(response.data.data.rendered);
    } catch (err) {
      showError('Failed to render template');
      console.error('Failed to render template:', err);
    }
  };

  const handleShare = async (platform) => {
    try {
      await memberAPI.logShare(platform, selectedTemplate?.id);

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

      showSuccess(`Shared via ${platform}`);
      await loadData(); // Refresh stats
    } catch (err) {
      showError('Failed to log share');
      console.error('Failed to log share:', err);
    }
  };

  const copyToClipboard = (text, message = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    showSuccess(message);
  };

  const getPlatformConfig = (platform) => {
    const configs = {
      whatsapp: { icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'WhatsApp' },
      telegram: { icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Telegram' },
      twitter: { icon: Share2, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', label: 'Twitter' },
      facebook: { icon: Share2, color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/30', label: 'Facebook' },
      linkedin: { icon: Share2, color: 'text-blue-600', bg: 'bg-blue-700/10', border: 'border-blue-700/30', label: 'LinkedIn' },
      email: { icon: Mail, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Email' }
    };
    return configs[platform] || { icon: Share2, color: 'text-text-muted', bg: 'bg-glass-medium', border: 'border-glass-border', label: platform };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
        <LoadingSkeleton variant="card" />
        <div className="space-y-4">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="p-6"
      >
        <Card variant="glass" padding="xl">
          <div className="flex items-start gap-3 text-error">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Failed to Load Sharing Data</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadData} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${profile?.referralCode}`;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="p-6 space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          >
            <Share2 className="w-8 h-8 text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Share & Grow</h1>
            <p className="text-lg text-text-muted">Share your referral link and grow your network</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {shareStats && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Total Shares</p>
                  <p className="text-5xl font-display font-bold text-blue-400">
                    <AnimatedNumber value={shareStats.total_shares || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl bg-blue-500/10"
                >
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Platforms Used</p>
                  <p className="text-5xl font-display font-bold text-purple-400">
                    <AnimatedNumber value={shareStats.platforms_used || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="p-4 rounded-2xl bg-purple-500/10"
                >
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Referral Link Card */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl" glow="gold">
          <div className="flex items-center gap-3 mb-6">
            <ExternalLink className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl font-semibold">Your Referral Link</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-glass-medium border border-glass-border rounded-xl">
              <code className="text-sm text-text-muted font-mono break-all">
                {referralLink}
              </code>
            </div>

            <Button
              onClick={() => copyToClipboard(referralLink, 'Referral link copied!')}
              variant="primary"
              icon={<Copy className="w-5 h-5" />}
              fullWidth
            >
              Copy Referral Link
            </Button>

            <div className="pt-4 border-t border-glass-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Quick Share
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['whatsapp', 'telegram', 'twitter', 'facebook', 'linkedin', 'email'].map((platform) => {
                  const config = getPlatformConfig(platform);
                  const IconComponent = config.icon;
                  return (
                    <motion.button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 ${config.bg} border ${config.border} rounded-xl transition-all flex flex-col items-center gap-2 hover:shadow-lg`}
                    >
                      <IconComponent className={`w-6 h-6 ${config.color}`} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Message Templates */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-semibold">Pre-written Templates</h2>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Templates Available"
            description="Pre-written message templates will appear here when available."
            actionLabel="Refresh"
            onAction={loadData}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {templates.map((template, index) => (
              <motion.div key={template.id} variants={itemVariants}>
                <Card
                  variant={selectedTemplate?.id === template.id ? 'glass-strong' : 'glass'}
                  padding="lg"
                  interactive
                  glow={selectedTemplate?.id === template.id ? 'gold' : undefined}
                  className="cursor-pointer h-full"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    {selectedTemplate?.id === template.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <CheckCircle className="w-5 h-5 text-gold-400 fill-current" />
                      </motion.div>
                    )}
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gold-400/10 text-gold-400 border border-gold-400/30 mb-3">
                    {template.template_type}
                  </span>

                  {template.subject && (
                    <p className="text-sm text-text-muted mb-2">
                      <strong>Subject:</strong> {template.subject}
                    </p>
                  )}

                  <p className="text-sm text-text-muted line-clamp-3 mb-3">
                    {template.content}
                  </p>

                  {template.usage_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-text-dimmed">
                      <TrendingUp className="w-3 h-3" />
                      Used {template.usage_count} times
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Rendered Template Preview */}
      <AnimatePresence>
        {renderedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass-strong" padding="xl" glow="purple">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h3 className="text-2xl font-semibold">Template Preview</h3>
              </div>

              <div className="space-y-4">
                {renderedContent.subject && (
                  <div>
                    <label className="block text-sm font-medium text-text-dimmed mb-2">
                      Subject:
                    </label>
                    <div className="p-4 bg-glass-medium border border-glass-border rounded-xl">
                      <p className="text-base">{renderedContent.subject}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-dimmed mb-2">
                    Message:
                  </label>
                  <div className="p-4 bg-glass-medium border border-glass-border rounded-xl">
                    <p className="text-base text-text-muted whitespace-pre-wrap leading-relaxed">
                      {renderedContent.content}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => copyToClipboard(renderedContent.content, 'Message copied!')}
                  icon={<Copy className="w-5 h-5" />}
                  fullWidth
                >
                  Copy Message
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass-strong" padding="lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-400">Sharing Tips</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• Use pre-written templates to save time and maintain consistency</li>
                <li>• Share on multiple platforms to reach a wider audience</li>
                <li>• Personal messages perform better than generic ones</li>
                <li>• Track your sharing statistics to optimize your strategy</li>
                <li>• Follow up with interested prospects to increase conversions</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MemberShare;
