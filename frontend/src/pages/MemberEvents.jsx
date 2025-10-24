import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const MemberEvents = () => {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
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
    } catch (error) {
      console.error('Failed to load events:', error);
      setError(error.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId, status = 'accepted') => {
    try {
      await memberAPI.rsvpEvent(eventId, { status });
      alert(`Successfully RSVP'd to the event!`);
      loadEvents();
      if (selectedEvent && selectedEvent.id === eventId) {
        const response = await memberAPI.getEvent(eventId);
        setSelectedEvent(response.data.data.event);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to RSVP');
    }
  };

  const handleCancelRSVP = async (eventId) => {
    if (!confirm('Are you sure you want to cancel your RSVP?')) return;

    try {
      await memberAPI.cancelRsvp(eventId);
      alert('RSVP cancelled successfully');
      loadEvents();
      if (selectedEvent && selectedEvent.id === eventId) {
        const response = await memberAPI.getEvent(eventId);
        setSelectedEvent(response.data.data.event);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel RSVP');
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

  const getEventIcon = (type) => {
    const icons = {
      webinar: '🎥',
      training: '📚',
      meeting: '👥',
      workshop: '🛠️',
      other: '📅'
    };
    return icons[type] || '📅';
  };

  const getEventTypeBadge = (type) => {
    const colors = {
      webinar: 'var(--primary-gold)',
      training: 'var(--accent-green)',
      meeting: 'var(--accent-blue)',
      workshop: 'var(--accent-purple)',
      other: 'var(--text-muted)'
    };
    return colors[type] || 'var(--text-muted)';
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
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading events...</p>
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
            Unable to Load Events
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadEvents} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const displayEvents = activeTab === 'all' ? events : myEvents;

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
            Team Events
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            Join webinars, training sessions, and team meetings to learn and grow together
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="container" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'all' ? '2px solid var(--primary-gold)' : '2px solid transparent',
              color: activeTab === 'all' ? 'var(--primary-gold)' : 'var(--text-muted)',
              fontSize: 'var(--text-base)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveTab('my-events')}
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'my-events' ? '2px solid var(--primary-gold)' : '2px solid transparent',
              color: activeTab === 'my-events' ? 'var(--primary-gold)' : 'var(--text-muted)',
              fontSize: 'var(--text-base)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            My Events
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="container-narrow">
        {displayEvents.length === 0 ? (
          <div className="fade-in-up" style={{
            textAlign: 'center',
            padding: 'var(--space-3xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📅</div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.6'
            }}>
              {activeTab === 'all'
                ? 'No upcoming events at the moment. Check back soon!'
                : 'You have not registered for any events yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {displayEvents.map((event, index) => (
              <div
                key={event.id}
                className={`fade-in-up delay-${Math.min(index * 100, 500)}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: 'var(--space-xl)',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onClick={() => {
                  memberAPI.getEvent(event.id).then(res => {
                    setSelectedEvent(res.data.data.event);
                  });
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)' }}>
                  <div style={{ fontSize: '3rem', flexShrink: 0 }}>
                    {getEventIcon(event.event_type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                      <h3 style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        {event.title}
                      </h3>
                      <div style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        background: `rgba(${getEventTypeBadge(event.event_type)}, 0.1)`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        color: getEventTypeBadge(event.event_type),
                        textTransform: 'capitalize'
                      }}>
                        {event.event_type}
                      </div>
                      {event.user_rsvp_status && (
                        <div style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          background: 'rgba(var(--accent-green-rgb), 0.1)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--accent-green)'
                        }}>
                          ✓ Registered
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p style={{
                        color: 'var(--text-muted)',
                        fontSize: 'var(--text-base)',
                        marginBottom: 'var(--space-md)',
                        lineHeight: '1.6'
                      }}>
                        {event.description}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-lg)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-muted)'
                    }}>
                      <div>📅 {formatDateTime(event.start_time)}</div>
                      {event.registered_count !== undefined && (
                        <div>👥 {event.registered_count} registered</div>
                      )}
                      {event.creator_name && (
                        <div>👤 By {event.creator_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
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
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
              {getEventIcon(selectedEvent.event_type)}
            </div>

            <h2 style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: '600',
              marginBottom: 'var(--space-sm)',
              color: 'var(--text-primary)'
            }}>
              {selectedEvent.title}
            </h2>

            <div style={{
              display: 'inline-block',
              padding: 'var(--space-xs) var(--space-sm)',
              background: `rgba(${getEventTypeBadge(selectedEvent.event_type)}, 0.1)`,
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              color: getEventTypeBadge(selectedEvent.event_type),
              textTransform: 'capitalize',
              marginBottom: 'var(--space-lg)'
            }}>
              {selectedEvent.event_type}
            </div>

            {selectedEvent.description && (
              <p style={{
                color: 'var(--text-muted)',
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                marginBottom: 'var(--space-xl)'
              }}>
                {selectedEvent.description}
              </p>
            )}

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', fontSize: 'var(--text-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Start Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDateTime(selectedEvent.start_time)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>End Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDateTime(selectedEvent.end_time)}</span>
                </div>
                {selectedEvent.timezone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Timezone:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{selectedEvent.timezone}</span>
                  </div>
                )}
                {selectedEvent.max_attendees && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Capacity:</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {selectedEvent.registered_count || 0} / {selectedEvent.max_attendees}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.meeting_link && selectedEvent.user_rsvp_status === 'accepted' && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => window.open(selectedEvent.meeting_link, '_blank')}
                  >
                    Join Meeting
                  </Button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              {!selectedEvent.user_rsvp_status ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => handleRSVP(selectedEvent.id, 'accepted')}
                    style={{ flex: 1 }}
                  >
                    RSVP to Event
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedEvent(null)}
                    style={{ flex: 1 }}
                  >
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="danger"
                    onClick={() => handleCancelRSVP(selectedEvent.id)}
                    style={{ flex: 1 }}
                  >
                    Cancel RSVP
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedEvent(null)}
                    style={{ flex: 1 }}
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberEvents;
