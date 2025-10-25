import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Shield, TrendingUp, Users, DollarSign, Lock,
  CheckCircle, ArrowRight, Sparkles, ChevronDown
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import AnimatedNumber from '../components/AnimatedNumber';
import {
  pageVariants,
  pageTransition,
  containerVariants,
  itemVariants,
  slowStaggerContainer,
  fadeInUp,
  scaleIn
} from '../utils/animations';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning-Fast Commissions',
      description: 'Earn USDT instantly when your network grows. No waiting periods, no payment delays—your commissions hit your wallet in real-time, automatically.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Unlimited Depth Earnings',
      description: 'Earn from your entire network with no depth limits. Our dynamic weighted distribution system ensures fair earnings across unlimited levels of your downline.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: '100% Transparent',
      description: 'Every transaction recorded on the blockchain. Complete transparency, zero manipulation, cryptographically protected income.'
    }
  ];

  const stats = [
    { label: 'USDT Payouts', value: 'Real-Time', gradient: true },
    { label: 'Network Depth', value: 'Unlimited', gradient: true },
    { label: 'Verified', value: 'Blockchain', gradient: true }
  ];

  const steps = [
    {
      number: '01',
      title: 'Join the Network',
      description: 'Register with a referral link and pay the one-time 100 USDT membership fee. Your upline earns commissions instantly.'
    },
    {
      number: '02',
      title: 'Share Your Link',
      description: 'Get your unique referral link and share it with your network. Every member who joins through your link becomes part of your downline.'
    },
    {
      number: '03',
      title: 'Earn Automatically',
      description: 'Receive USDT commissions automatically when anyone in your 5-level network recruits new members. Passive income that compounds as your network grows.'
    }
  ];

  const faqs = [
    {
      question: 'What is Atlas Network?',
      answer: 'Atlas Network is a blockchain-powered network marketing platform where you earn real USDT cryptocurrency by building a referral network. When someone joins using your referral link, commissions are automatically distributed across 5 levels.'
    },
    {
      question: 'How much does it cost?',
      answer: 'One-time membership: 100 USDT. No monthly fees, no hidden charges, no renewal costs. Your membership is lifetime.'
    },
    {
      question: 'Is this legal?',
      answer: 'Completely legal. Atlas Network is a legitimate referral marketing system with real value exchange. Our 5-level cap prevents pyramid expansion, and all transactions are blockchain-verified.'
    },
    {
      question: 'When do I receive commissions?',
      answer: 'Instantly! Commissions are distributed automatically to your wallet the moment a new member joins through your network. No waiting, no manual processing.'
    }
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-bg-page to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
        </div>

        <div className="container relative z-10">
          <motion.div
            variants={slowStaggerContainer}
            initial="hidden"
            animate="show"
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass-medium border border-glass-border text-sm font-medium text-gold-400">
                <Sparkles className="w-4 h-4" />
                Blockchain-Powered Network Marketing
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-8xl font-display font-bold mb-8 leading-tight tracking-tight"
            >
              Build Your{' '}
              <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-green-500 bg-clip-text text-transparent">
                Financial Future
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Join a revolutionary platform where you earn USDT through unlimited depth commission structure
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={() => navigate('/login')}
                size="xl"
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                Get Started
              </Button>
              <Button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                size="xl"
              >
                Learn More
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-16 flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown className="w-8 h-8 text-text-dimmed" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-bg-section">
        <div className="container">
          <motion.div
            variants={slowStaggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
                Why Atlas Network
              </h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto">
                The most transparent and fair network marketing platform
              </p>
            </motion.div>

            <div className="space-y-12">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ x: 10 }}
                  className="group"
                >
                  <Card
                    variant="glass"
                    padding="xl"
                    className="border-l-4 border-gold-400 hover:border-green-500 transition-colors"
                  >
                    <div className="flex items-start gap-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-400/20 to-green-500/20 text-gold-400 group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-display font-semibold mb-4">
                          {feature.title}
                        </h3>
                        <p className="text-lg text-text-muted leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="container"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <Card variant="glass" padding="xl" interactive glow="gold">
                  <div className="text-6xl md:text-7xl font-display font-bold mb-4 bg-gradient-to-r from-gold-400 to-green-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-lg text-text-muted">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-bg-section">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            variants={slowStaggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
                How It Works
              </h2>
            </motion.div>

            <div className="space-y-16">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative"
                >
                  <div className="flex items-start gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-green-500 flex items-center justify-center text-3xl font-bold text-black shadow-glow-gold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-3xl font-display font-semibold mb-4">
                        {step.title}
                      </h3>
                      <p className="text-lg text-text-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="ml-10 mt-6 mb-6 h-16 border-l-2 border-dashed border-glass-border" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            variants={slowStaggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card
                    variant="glass"
                    padding="none"
                    className="overflow-hidden cursor-pointer"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <div className="p-6 flex items-center justify-between hover:bg-glass-light transition-colors">
                      <h3 className="text-xl font-semibold">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: activeFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        height: activeFaq === index ? 'auto' : 0,
                        opacity: activeFaq === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-lg text-text-muted leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-br from-bg-section via-bg-page to-bg-section">
        <motion.div
          variants={slowStaggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="container text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass-medium border border-glass-border text-sm font-medium text-gold-400 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Start Earning Today
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-7xl font-display font-bold mb-8"
          >
            Ready to Start Earning?
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-xl text-text-muted mb-12 max-w-2xl mx-auto"
          >
            Join thousands of members already building their financial freedom with Atlas Network
          </motion.p>

          <motion.div variants={itemVariants}>
            <Button
              onClick={() => navigate('/login')}
              size="xl"
              variant="primary"
              iconRight={<ArrowRight className="w-5 h-5" />}
            >
              Join Atlas Network
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default LandingPage;
