import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const LandingPage = () => {
  const navigate = useNavigate();

  const heroStyles = {
    minHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
  };

  const sectionStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 2rem'
  };

  const featureGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginTop: '3rem'
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={heroStyles}>
        <div style={{ maxWidth: '800px' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #fbbf24 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            Welcome to Atlas Network
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#a0aec0',
            marginBottom: '2rem',
            lineHeight: '1.8'
          }}>
            Build Your Financial Future Through Network Marketing
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#cbd5e0',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Join a revolutionary platform where you can earn USDT through a proven 5-level commission structure.
            Start your journey to financial independence today.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}
            >
              Get Started
            </Button>
            <Button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={sectionStyles}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Platform Features</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>Everything you need to succeed</p>
        </div>
        <div style={featureGrid}>
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>USDT Payments</h3>
            <p style={{ color: '#a0aec0' }}>
              Earn real cryptocurrency (USDT) through our proven commission structure. Instant, transparent, and secure.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>5-Level Commission</h3>
            <p style={{ color: '#a0aec0' }}>
              Earn from 5 levels deep: 10%, 7%, 5%, 3%, and 2%. Build a strong network and watch your income grow.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Real-Time Analytics</h3>
            <p style={{ color: '#a0aec0' }}>
              Track your network, earnings, and performance with comprehensive analytics and reporting tools.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Referral System</h3>
            <p style={{ color: '#a0aec0' }}>
              Easy-to-share referral links make it simple to grow your network and increase your earnings.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Secure Platform</h3>
            <p style={{ color: '#a0aec0' }}>
              Enterprise-grade security with encrypted transactions and protected user data. Your success is our priority.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Mobile Friendly</h3>
            <p style={{ color: '#a0aec0' }}>
              Access your dashboard anytime, anywhere. Fully responsive design works on all devices.
            </p>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ ...sectionStyles, background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>About Atlas Network</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>Building success together</p>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card style={{ padding: '2.5rem' }}>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e0', marginBottom: '1.5rem' }}>
              Atlas Network is a cutting-edge platform designed for network marketers who want to build sustainable income streams through proven referral marketing strategies.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e0', marginBottom: '1.5rem' }}>
              Our 5-level commission structure ensures that everyone in your network benefits from growth, creating a win-win environment where success is shared across all participants.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e0' }}>
              With transparent USDT payments, real-time tracking, and comprehensive support, we provide everything you need to achieve your financial goals through network marketing.
            </p>
          </Card>
        </div>
      </section>

      {/* Advantages Section */}
      <section style={sectionStyles}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Why Choose Atlas Network?</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>The advantages that set us apart</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Passive Income Potential</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Build once, earn forever. Your network continues to generate commissions even when you're not actively recruiting.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ No Hidden Fees</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Transparent pricing with no surprise charges. What you earn is what you keep (minus standard processing fees).
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Proven System</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Our 5-level commission structure has been tested and optimized for maximum earning potential across all levels.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Community Support</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Join a thriving community of network marketers who support each other's growth and success.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Instant Payouts</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Commissions are credited instantly to your account. No waiting periods or payment delays.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Scalable Growth</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              No limits on how large your network can grow. The sky's the limit for your earning potential.
            </p>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ ...sectionStyles, background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>Everything you need to know</p>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fbbf24' }}>How does the commission structure work?</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              When someone joins using your referral link, you earn 10% commission. When they refer someone, you earn 7% from that person. This continues for 5 levels: 10%, 7%, 5%, 3%, and 2%.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fbbf24' }}>How do I get paid?</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              All payments are made in USDT (Tether), a stable cryptocurrency. Commissions are credited instantly to your account balance and can be withdrawn at any time.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fbbf24' }}>Is there a joining fee?</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Yes, there is a one-time recruitment fee of 100 USDT. This fee is distributed as commissions to your upline according to the 5-level structure.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fbbf24' }}>Can I join without a referral?</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              No, a referral code is mandatory to join Atlas Network. This ensures everyone is part of a support network and benefits from the commission structure.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fbbf24' }}>How do I track my earnings?</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Your dashboard provides real-time analytics showing your balance, total earnings, network size, and detailed transaction history for complete transparency.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fbbf24' }}>What if I need help?</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Our support team and community are here to help. Contact your upline or reach out to our instructor for guidance and support.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ ...sectionStyles, textAlign: 'center' }}>
        <Card style={{
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(16, 185, 129, 0.1))',
          border: '2px solid rgba(251, 191, 36, 0.3)'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Start Earning?</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Join Atlas Network today and start building your path to financial freedom through network marketing.
          </p>
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}
          >
            Join Now
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default LandingPage;
