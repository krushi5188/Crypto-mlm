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
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Why Atlas Network Leads the Industry</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>Built for serious network marketers who want real results</p>
        </div>
        <div style={featureGrid}>
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Lightning-Fast Commissions</h3>
            <p style={{ color: '#a0aec0' }}>
              Earn USDT instantly when your network grows. No waiting periods, no payment delays—your commissions hit your wallet in real-time, automatically.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Proven 5-Level System</h3>
            <p style={{ color: '#a0aec0' }}>
              Maximize your earnings with our battle-tested 5-level structure (10%, 7%, 5%, 3%, 2%). Designed to reward both builders and recruiters fairly.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>100% Transparent Blockchain</h3>
            <p style={{ color: '#a0aec0' }}>
              Every transaction recorded on the blockchain. See exactly where every USDT comes from and goes to—complete transparency, zero manipulation.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Advanced Analytics Dashboard</h3>
            <p style={{ color: '#a0aec0' }}>
              Track every member, every commission, every level in real-time. Powerful insights help you identify top performers and optimize your growth strategy.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Zero Geographic Limits</h3>
            <p style={{ color: '#a0aec0' }}>
              Build your network globally with USDT cryptocurrency—no bank restrictions, no country limitations. Your team can be anywhere in the world.
            </p>
          </Card>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Set It & Earn Forever</h3>
            <p style={{ color: '#a0aec0' }}>
              Build your network once, earn passive income continuously. Your downline's success becomes your success—automated, perpetual earnings.
            </p>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ ...sectionStyles, background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Empowering Financial Freedom Through Smart Network Marketing</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>The blockchain-powered platform built for serious income builders</p>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card style={{ padding: '2.5rem' }}>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e0', marginBottom: '1.5rem' }}>
              Atlas Network is a revolutionary blockchain-based platform that eliminates the complexity from network marketing. We've engineered a transparent, automated system where USDT cryptocurrency flows directly from your network's growth to your wallet—instantly and permanently.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e0', marginBottom: '1.5rem' }}>
              Our mathematically optimized 5-level commission structure (10%, 7%, 5%, 3%, 2%) ensures that every member of your network—from direct recruits to 5 levels deep—contributes to your passive income stream. No products to sell, no inventory to manage, no complex qualifications to meet.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e0' }}>
              Built on enterprise-grade technology with military-level security, Atlas Network provides the infrastructure, automation, and transparency you need to build a legitimate, sustainable income. Your success is measured in real USDT, tracked on the blockchain, and completely within your control.
            </p>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <Card style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(251, 191, 36, 0.1)' }}>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>INSTANT PAYOUTS</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>Real-Time USDT</div>
            </Card>
            
            <Card style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>PROVEN STRUCTURE</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>5 Income Levels</div>
            </Card>

            <Card style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)' }}>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>FULLY TRANSPARENT</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>Blockchain Verified</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section style={sectionStyles}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>The Atlas Network Advantage</h2>
          <p style={{ color: '#a0aec0', fontSize: '1.125rem' }}>Why top earners choose Atlas Network over traditional MLM platforms</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Cryptocurrency-Powered Income</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Receive earnings in USDT, not points or monopoly money. Real cryptocurrency that you can hold, trade, or convert to any currency worldwide—instant liquidity, zero bureaucracy.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Mathematical Fairness Guaranteed</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Our 5-level structure is mathematically optimized for sustainable growth. Unlike unlimited-level plans that collapse, our system ensures everyone earns fairly without pyramid scheme risks.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Zero Gatekeeping or Quotas</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              No monthly fees, no minimum recruitment targets, no rank qualifications to maintain. Build at your pace—your network never expires, your income never resets.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Immutable Blockchain Records</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Every transaction permanently recorded on-chain. No company can manipulate your earnings, freeze your account, or "adjust" commissions—your income is cryptographically protected.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Institutional-Grade Infrastructure</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              Built on enterprise technology with 99.9% uptime, DDoS protection, and bank-level encryption. Your business runs 24/7 without interruption—professional reliability you can stake your income on.
            </p>
          </Card>

          <Card style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981' }}>✓ Compound Growth Multiplier</h3>
            <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
              When your Level 1 recruits succeed, you earn from their entire 5-level network. This compounding effect creates exponential income growth as your organization scales globally.
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
