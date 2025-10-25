import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, FileText, Video, Image, Link as LinkIcon, FileCheck,
  Download, Eye, AlertCircle, Search, Filter, X
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';

const MemberResources = () => {
  const { success: showSuccess, error: showError } = useToast();
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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resourcesRes, categoriesRes] = await Promise.all([
        memberAPI.getResources(filters),
        memberAPI.getResourceCategories()
      ]);
      setResources(resourcesRes.data.data.resources);
      setCategories(categoriesRes.data.data.categories);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load resources';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResource = async (resource) => {
    setSelectedResource(resource);
    setShowModal(true);
    try {
      await memberAPI.getResource(resource.id);
    } catch (err) {
      console.error('Failed to log resource view:', err);
    }
  };

  const handleDownload = async (resourceId, fileUrl) => {
    try {
      await memberAPI.logDownload(resourceId);
      window.open(fileUrl, '_blank');
      showSuccess('Download started');
    } catch (err) {
      showError('Failed to download resource');
      console.error('Failed to log download:', err);
    }
  };

  const getResourceConfig = (type) => {
    const configs = {
      document: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Document' },
      video: { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Video' },
      image: { icon: Image, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', label: 'Image' },
      link: { icon: LinkIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Link' },
      template: { icon: FileCheck, color: 'text-gold-400', bg: 'bg-gold-400/10', border: 'border-gold-400/30', label: 'Template' }
    };
    return configs[type] || { icon: FileText, color: 'text-text-muted', bg: 'bg-glass-medium', border: 'border-glass-border', label: 'Resource' };
  };

  const clearFilters = () => {
    setFilters({
      type: null,
      category: null,
      search: ''
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <LoadingSkeleton variant="card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={6} />
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Resources</h3>
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

  const hasActiveFilters = filters.type || filters.category || filters.search;

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
            <BookOpen className="w-8 h-8 text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Training Resources</h1>
            <p className="text-lg text-text-muted">Access materials to grow your business</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Filters</h3>
              </div>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                >
                  Clear
                </Button>
              )}
            </div>

            <Input
              type="text"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon={<Search className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resource Type</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || null }))}
                  className="w-full px-4 py-3 bg-glass-medium border border-glass-border rounded-xl focus:outline-none focus:border-gold-400 transition-colors"
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
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || null }))}
                  className="w-full px-4 py-3 bg-glass-medium border border-glass-border rounded-xl focus:outline-none focus:border-gold-400 transition-colors"
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
      </motion.div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <EmptyState
            icon={BookOpen}
            title="No Resources Found"
            description={hasActiveFilters ? "No resources match your filters. Try adjusting them." : "No resources available at the moment."}
            actionLabel={hasActiveFilters ? "Clear Filters" : "Refresh"}
            onAction={hasActiveFilters ? clearFilters : loadData}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {resources.map((resource, index) => {
            const config = getResourceConfig(resource.resource_type);
            const IconComponent = config.icon;

            return (
              <motion.div key={resource.id} variants={itemVariants}>
                <Card
                  variant="glass"
                  padding="lg"
                  interactive
                  className="cursor-pointer h-full flex flex-col"
                  onClick={() => handleViewResource(resource)}
                >
                  <div className="flex-1 space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 ${config.bg} border ${config.border} rounded-2xl flex items-center justify-center`}
                    >
                      <IconComponent className={`w-8 h-8 ${config.color}`} />
                    </motion.div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-text-muted line-clamp-3 mb-3">
                          {resource.description}
                        </p>
                      )}
                    </div>

                    {resource.category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gold-400/10 text-gold-400 border border-gold-400/30">
                        {resource.category}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-glass-border mt-4">
                    <div className="flex items-center justify-between text-xs text-text-dimmed mb-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <AnimatedNumber value={resource.view_count || 0} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <AnimatedNumber value={resource.download_count || 0} />
                      </div>
                    </div>

                    {resource.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        icon={<Download className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(resource.id, resource.file_url);
                        }}
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Resource Detail Modal */}
      {selectedResource && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedResource(null);
          }}
          title={selectedResource.title}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${getResourceConfig(selectedResource.resource_type).bg} border ${getResourceConfig(selectedResource.resource_type).border} rounded-2xl flex items-center justify-center`}>
                {React.createElement(getResourceConfig(selectedResource.resource_type).icon, {
                  className: `w-8 h-8 ${getResourceConfig(selectedResource.resource_type).color}`
                })}
              </div>
              <div>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getResourceConfig(selectedResource.resource_type).bg} ${getResourceConfig(selectedResource.resource_type).color} border ${getResourceConfig(selectedResource.resource_type).border}`}>
                  {getResourceConfig(selectedResource.resource_type).label}
                </span>
                {selectedResource.category && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gold-400/10 text-gold-400 border border-gold-400/30">
                      {selectedResource.category}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedResource.description && (
              <p className="text-base text-text-muted leading-relaxed">
                {selectedResource.description}
              </p>
            )}

            {selectedResource.content && (
              <Card variant="glass-medium" padding="lg">
                <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
                  {selectedResource.content}
                </p>
              </Card>
            )}

            <Card variant="glass-medium" padding="lg">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-2xl font-bold text-blue-400">
                      <AnimatedNumber value={selectedResource.view_count || 0} />
                    </span>
                  </div>
                  <p className="text-xs text-text-dimmed">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-green-400" />
                    <span className="text-2xl font-bold text-green-400">
                      <AnimatedNumber value={selectedResource.download_count || 0} />
                    </span>
                  </div>
                  <p className="text-xs text-text-dimmed">Downloads</p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              {selectedResource.file_url && (
                <Button
                  variant="primary"
                  onClick={() => handleDownload(selectedResource.id, selectedResource.file_url)}
                  fullWidth
                  icon={<Download className="w-5 h-5" />}
                >
                  Download Resource
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setSelectedResource(null);
                }}
                fullWidth
                icon={<X className="w-5 h-5" />}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default MemberResources;
