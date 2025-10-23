import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section - Full screen, huge text */}
      <section className="section-hero fade-in">
        <div className="container-narrow text-center">
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            marginBottom: 'var(--space-lg)',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            fontWeight: '700'
          }}>
            Build Your Financial Future
          </h1>
          <p style={{
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-xl)',
            lineHeight: '1.6',
            maxWidth: '800px',
            margin: '0 auto var(--space-xl)'
          }}>
            Join a revolutionary blockchain platform where you earn USDT through a transparent 5-level commission structure
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              style={{ 
                padding: '1.25rem 3rem', 
                fontSize: '1.25rem',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              Get Started
            </Button>
            <Button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              style={{ 
                padding: '1.25rem 3rem', 
                fontSize: '1.25rem',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Spacious with large text, no cards */}
      <section id="features" className="section-spacious" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-md)' }}>Why Atlas Network</h2>
            <p style={{ 
              fontSize: 'var(--text-xl)', 
              color: 'var(--text-muted)',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              The most transparent and fair network marketing platform
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gap: 'var(--space-xl)',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Feature 1 */}
            <div className="fade-in-up delay-100" style={{ 
              padding: 'var(--space-xl) 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                fontSize: 'var(--text-5xl)', 
                marginBottom: 'var(--space-md)',
                fontWeight: '700',
                letterSpacing: '-0.02em'
              }}>
                Lightning-Fast Commissions
              </div>
              <p style={{ 
                fontSize: 'var(--text-xl)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7',
                maxWidth: '800px'
              }}>
                Earn USDT instantly when your network grows. No waiting periods, no payment delays—your commissions hit your wallet in real-time, automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="fade-in-up delay-200" style={{ 
              padding: 'var(--space-xl) 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                fontSize: 'var(--text-5xl)', 
                marginBottom: 'var(--space-md)',
                fontWeight: '700',
                letterSpacing: '-0.02em'
              }}>
                Proven 5-Level System
              </div>
              <p style={{ 
                fontSize: 'var(--text-xl)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7',
                maxWidth: '800px'
              }}>
                Maximize earnings with our battle-tested structure: 10%, 7%, 5%, 3%, 2%. Mathematically optimized for sustainable growth.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="fade-in-up delay-300" style={{ 
              padding: 'var(--space-xl) 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                fontSize: 'var(--text-5xl)', 
                marginBottom: 'var(--space-md)',
                fontWeight: '700',
                letterSpacing: '-0.02em'
              }}>
                100% Transparent
              </div>
              <p style={{ 
                fontSize: 'var(--text-xl)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7',
                maxWidth: '800px'
              }}>
                Every transaction recorded on the blockchain. Complete transparency, zero manipulation, cryptographically protected income.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Large numbers */}
      <section className="section-spacious">
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-xl)',
            textAlign: 'center'
          }}>
            <div className="fade-in-up delay-100">
              <div style={{ 
                fontSize: 'var(--text-6xl)', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 'var(--space-sm)'
              }}>
                Real-Time
              </div>
              <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>
                USDT Payouts
              </div>
            </div>

            <div className="fade-in-up delay-200">
              <div style={{ 
                fontSize: 'var(--text-6xl)', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 'var(--space-sm)'
              }}>
                5 Levels
              </div>
              <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>
                Income Structure
              </div>
            </div>

            <div className="fade-in-up delay-300">
              <div style={{ 
                fontSize: 'var(--text-6xl)', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 'var(--space-sm)'
              }}>
                Blockchain
              </div>
              <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>
                Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Large text, minimal */}
      <section className="section-spacious" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container-narrow">
          <h2 className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            How It Works
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
            <div className="fade-in-up delay-100">
              <div style={{ 
                fontSize: 'var(--text-4xl)', 
                fontWeight: '600',
                marginBottom: 'var(--space-md)',
                color: 'var(--primary-gold)'
              }}>
                01
              </div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Join the Network</h3>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7'
              }}>
                Register with a referral link and pay the one-time 100 USDT membership fee. Your upline earns commissions instantly.
              </p>
            </div>

            <div className="fade-in-up delay-200">
              <div style={{ 
                fontSize: 'var(--text-4xl)', 
                fontWeight: '600',
                marginBottom: 'var(--space-md)',
                color: 'var(--primary-gold)'
              }}>
                02
              </div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Share Your Link</h3>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7'
              }}>
                Get your unique referral link and share it with your network. Every member who joins through your link becomes part of your downline.
              </p>
            </div>

            <div className="fade-in-up delay-300">
              <div style={{ 
                fontSize: 'var(--text-4xl)', 
                fontWeight: '600',
                marginBottom: 'var(--space-md)',
                color: 'var(--primary-gold)'
              }}>
                03
              </div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Earn Automatically</h3>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7'
              }}>
                Receive USDT commissions automatically when anyone in your 5-level network recruits new members. Passive income that compounds as your network grows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Minimal design */}
      <section id="faq" className="section-spacious">
        <div className="container-narrow">
          <h2 className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div className="fade-in-up delay-100" style={{ 
              paddingBottom: 'var(--space-lg)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ 
                marginBottom: 'var(--space-md)',
                fontSize: 'var(--text-2xl)',
                fontWeight: '600'
              }}>
                What is Atlas Network?
              </h3>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7'
              }}>
                Atlas Network is a blockchain-powered network marketing platform where you earn real USDT cryptocurrency by building a referral network. When someone joins using your referral link, commissions are automatically distributed across 5 levels.
              </p>
            </div>

            <div className="fade-in-up delay-200" style={{ 
              paddingBottom: 'var(--space-lg)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ 
                marginBottom: 'var(--space-md)',
                fontSize: 'var(--text-2xl)',
                fontWeight: '600'
              }}>
                How much does it cost?
              </h3>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7'
              }}>
                One-time membership: 100 USDT. No monthly fees, no hidden charges, no renewal costs. Your membership is lifetime.
              </p>
            </div>

            <div className="fade-in-up delay-300" style={{ 
              paddingBottom: 'var(--space-lg)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ 
                marginBottom: 'var(--space-md)',
                fontSize: 'var(--text-2xl)',
                fontWeight: '600'
              }}>
                Is this legal?
              </h3>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--text-muted)',
                lineHeight: '1.7'
              }}>
                Completely legal. Atlas Network is a legitimate referral marketing system with real value exchange. Our 5-level cap prevents pyramid expansion, and all transactions are blockchain-verified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Huge, simple */}
      <section className="section-spacious" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container text-center">
          <h2 className="fade-in" style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            marginBottom: 'var(--space-xl)',
            fontWeight: '700'
          }}>
            Ready to Start Earning?
          </h2>
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="fade-in-up delay-100"
            style={{ 
              padding: '1.5rem 4rem', 
              fontSize: '1.5rem',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            Join Atlas Network
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
