import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Video, BookOpen, Users, Wrench, Clock, MapPin,
  CheckCircle, AlertCircle, ExternalLink, UserCheck, X, Info
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
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

const MemberEvents = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my-events'

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      if (activeTab === 'all') {
        const response = await memberAPI.getEvents({ upcoming: 'true' });
        setEvents(response.data.data.events);
      } else {
        const response = await memberAPI.getMyEvents({ upcoming: 'true' });
        setMyEvents(response.data.data.events);
      }
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load events';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId, status = 'accepted') => {
    try {
      await memberAPI.rsvpEvent(eventId, { status });
      showSuccess('Successfully RSVP\'d to the event!');
      await loadEvents();
      if (selectedEvent && selectedEvent.id === eventId) {
        const response = await memberAPI.getEvent(eventId);
        setSelectedEvent(response.data.data.event);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to RSVP');
    }
  };

  const handleCancelRSVP = async (eventId) => {
    try {
      await memberAPI.cancelRsvp(eventId);
      showSuccess('RSVP cancelled successfully');
      await loadEvents();
      setShowModal(false);
      setSelectedEvent(null);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to cancel RSVP');
    }
  };

  const handleViewEvent = async (event) => {
    try {
      const response = await memberAPI.getEvent(event.id);
      setSelectedEvent(response.data.data.event);
      setShowModal(true);
    } catch (err) {
      showError('Failed to load event details');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventConfig = (type) => {
    const configs = {
      webinar: { icon: Video, color: 'text-gold-400', bg: 'bg-gold-400/10', border: 'border-gold-400/30', label: 'Webinar' },
      training: { icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Training' },
      meeting: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Meeting' },
      workshop: { icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Workshop' },
      other: { icon: Calendar, color: 'text-text-muted', bg: 'bg-glass-medium', border: 'border-glass-border', label: 'Event' }
    };
    return configs[type] || configs.other;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="flex gap-3">
          <LoadingSkeleton variant="button" width="150px" />
          <LoadingSkeleton variant="button" width="150px" />
        </div>
        <div className="space-y-4">
          <LoadingSkeleton variant="card" count={4} />
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Events</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadEvents} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const displayEvents = activeTab === 'all' ? events : myEvents;

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
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
          >
            <Calendar className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Team Events</h1>
            <p className="text-lg text-text-muted">Join webinars, training sessions, and team meetings</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="none">
          <div className="flex gap-8 px-6 border-b border-glass-border relative">
            <motion.button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-4 font-medium transition-colors relative ${
                activeTab === 'all' ? 'text-gold-400' : 'text-text-dimmed hover:text-text-primary'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <Calendar className="w-4 h-4" />
              <span>All Events</span>
              {activeTab === 'all' && (
                <motion.div
                  layoutId="activeEventTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('my-events')}
              className={`flex items-center gap-2 px-4 py-4 font-medium transition-colors relative ${
                activeTab === 'my-events' ? 'text-gold-400' : 'text-text-dimmed hover:text-text-primary'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Events</span>
              {activeTab === 'my-events' && (
                <motion.div
                  layoutId="activeEventTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {/* Events List */}
      <AnimatePresence mode="wait">
        {displayEvents.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              icon={Calendar}
              title={activeTab === 'all' ? 'No Upcoming Events' : 'No Registered Events'}
              description={
                activeTab === 'all'
                  ? 'No upcoming events at the moment. Check back soon!'
                  : 'You have not registered for any events yet. Browse all events to find one to join.'
              }
              actionLabel="Refresh"
              onAction={loadEvents}
            />
          </motion.div>
        ) : (
          <motion.div
            key="events"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {displayEvents.map((event, index) => {
              const config = getEventConfig(event.event_type);
              const IconComponent = config.icon;
              
              return (
                <motion.div key={event.id} variants={itemVariants}>
                  <Card
                    variant={event.user_rsvp_status ? 'glass-strong' : 'glass'}
                    padding="lg"
                    interactive
                    glow={event.user_rsvp_status ? 'green' : undefined}
                    className="cursor-pointer"
                    onClick={() => handleViewEvent(event)}
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Event Icon */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`flex-shrink-0 w-16 h-16 ${config.bg} border ${config.border} rounded-2xl flex items-center justify-center`}
                      >
                        <IconComponent className={`w-8 h-8 ${config.color}`} />
                      </motion.div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold">{event.title}</h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                              {config.label}
                            </span>
                            {event.user_rsvp_status && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30"
                              >
                                <CheckCircle className="w-3 h-3 fill-current" />
                                Registered
                              </motion.span>
                            )}
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-sm text-text-muted mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-text-dimmed">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDateTime(event.start_time)}
                          </div>
                          {event.registered_count !== undefined && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <AnimatedNumber value={event.registered_count} /> registered
                            </div>
                          )}
                          {event.creator_name && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              By {event.creator_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }}
          title={selectedEvent.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Event Icon and Type */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${getEventConfig(selectedEvent.event_type).bg} border ${getEventConfig(selectedEvent.event_type).border} rounded-2xl flex items-center justify-center`}>
                {React.createElement(getEventConfig(selectedEvent.event_type).icon, {
                  className: `w-8 h-8 ${getEventConfig(selectedEvent.event_type).color}`
                })}
              </div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getEventConfig(selectedEvent.event_type).bg} ${getEventConfig(selectedEvent.event_type).color} border ${getEventConfig(selectedEvent.event_type).border}`}>
                {getEventConfig(selectedEvent.event_type).label}
              </span>
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <p className="text-base text-text-muted leading-relaxed">
                {selectedEvent.description}
              </p>
            )}

            {/* Event Details */}
            <Card variant="glass-medium" padding="lg">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-text-dimmed flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Time
                  </span>
                  <span className="text-sm font-medium text-right">{formatDateTime(selectedEvent.start_time)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-text-dimmed flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    End Time
                  </span>
                  <span className="text-sm font-medium text-right">{formatDateTime(selectedEvent.end_time)}</span>
                </div>
                {selectedEvent.timezone && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-text-dimmed flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Timezone
                    </span>
                    <span className="text-sm font-medium">{selectedEvent.timezone}</span>
                  </div>
                )}
                {selectedEvent.max_attendees && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-text-dimmed flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Capacity
                    </span>
                    <span className="text-sm font-medium">
                      <AnimatedNumber value={selectedEvent.registered_count || 0} /> / {selectedEvent.max_attendees}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Meeting Link */}
            {selectedEvent.meeting_link && selectedEvent.user_rsvp_status === 'accepted' && (
              <Card variant="glass-strong" padding="lg" glow="green">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-green-400" />
                  <h4 className="font-semibold text-green-400">You're Registered!</h4>
                </div>
                <Button
                  variant="success"
                  fullWidth
                  icon={<ExternalLink className="w-5 h-5" />}
                  onClick={() => window.open(selectedEvent.meeting_link, '_blank')}
                >
                  Join Meeting
                </Button>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!selectedEvent.user_rsvp_status ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => handleRSVP(selectedEvent.id, 'accepted')}
                    fullWidth
                    icon={<CheckCircle className="w-5 h-5" />}
                  >
                    RSVP to Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedEvent(null);
                    }}
                    fullWidth
                  >
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="danger"
                    onClick={() => handleCancelRSVP(selectedEvent.id)}
                    fullWidth
                    icon={<X className="w-5 h-5" />}
                  >
                    Cancel RSVP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedEvent(null);
                    }}
                    fullWidth
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default MemberEvents;
