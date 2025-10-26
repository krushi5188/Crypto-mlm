import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/base/Button'
import {
  TrendingUp, Users, DollarSign, Shield, Zap, Lock,
  CheckCircle, ArrowRight, BarChart3, Globe
} from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()
  const [activeFaq, setActiveFaq] = useState(null)

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  }

  // Compelling Features
  const features = [
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: 'Unlimited Earning Potential',
      description: 'Unlike traditional MLM systems limited to 5 levels, Atlas Network uses dynamic weighted distribution across your ENTIRE downline. The deeper your network grows, the more you earn. No artificial caps, no missed opportunities.'
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: 'Instant USDT Commissions',
      description: 'The moment someone joins through your network, commissions hit your wallet automatically. No waiting periods, no manual processing, no payment delays. Real cryptocurrency, real-time transfers, directly to your wallet.'
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: 'Blockchain-Verified Transparency',
      description: 'Every transaction is recorded on the blockchain. See exactly where every dollar comes from and goes to. No hidden fees, no manipulation, no trust required - the code enforces honesty.'
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: 'Smart Commission Distribution',
      description: 'Our algorithm ensures fair distribution across your entire upline using weighted calculations. Top-level members earn more, but everyone in the chain gets rewarded - creating alignment and motivation across the network.'
    },
    {
      icon: <Lock className="w-12 h-12" />,
      title: 'Secure & Professional Platform',
      description: 'Enterprise-grade security with 2FA, encrypted data, and fraud detection systems. Your earnings and personal information are protected by the same technology banks use.'
    },
    {
      icon: <Globe className="w-12 h-12" />,
      title: 'Global Network, Local Currency',
      description: 'Accept payments in USDT (cryptocurrency) from anywhere in the world. No currency conversions, no international fees, no banking restrictions. Build your network globally, earn universally.'
    }
  ]

  // Simple How It Works
  const steps = [
    {
      number: '01',
      title: 'Join With an Invitation',
      description: 'Atlas Network is invitation-only to maintain quality. Get your unique referral link from an existing member and pay the one-time 100 USDT membership fee. Your sponsor earns commissions instantly.'
    },
    {
      number: '02',
      title: 'Share Your Referral Link',
      description: 'Receive your personal referral code and share it with your network. Every person who joins through your link becomes part of your downline. Track your network growth in real-time on your dashboard.'
    },
    {
      number: '03',
      title: 'Earn Automatic Commissions',
      description: 'When anyone in your network recruits new members, you earn commissions automatically based on your position in the upline chain. The system distributes earnings fairly across unlimited levels - passive income that compounds as your network grows.'
    }
  ]

  // Comprehensive FAQs
  const faqs = [
    {
      question: 'What is Atlas Network?',
      answer: 'Atlas Network is a blockchain-powered referral platform where you build wealth by growing your network. Unlike traditional MLM systems with arbitrary level caps, we use advanced algorithms to distribute commissions fairly across your entire downline with no depth limit. Every transaction is verified on the blockchain for complete transparency.'
    },
    {
      question: 'How much does it cost to join?',
      answer: 'One-time payment: 100 USDT. That\'s it. No monthly fees, no renewal costs, no hidden charges, no upgrade tiers. Your membership is lifetime. The fee goes directly into the commission pool and is distributed to your upline chain.'
    },
    {
      question: 'How do I actually make money?',
      answer: 'You earn commissions when anyone in your network recruits new members. Direct recruits earn you the most. Then you also earn from their recruits, and their recruits\' recruits, infinitely deep. The commission amount decreases gradually as you go down levels, but there is NO level cap. Build a 100-level deep network if you can - you\'ll still earn from the bottom.'
    },
    {
      question: 'Is this a pyramid scheme? Is it legal?',
      answer: 'No, this is not a pyramid scheme. Pyramid schemes have no real value exchange and rely on recruitment alone. Atlas Network provides real networking value, transparent blockchain technology, and legitimate referral marketing. There are no promises of guaranteed returns, and earnings depend entirely on your network-building efforts. We operate in full compliance with cryptocurrency and MLM regulations.'
    },
    {
      question: 'When do I receive my commissions?',
      answer: 'Instantly. The moment a new member pays their 100 USDT fee, our smart contract automatically distributes commissions to the entire upline chain within seconds. You\'ll see the USDT appear in your wallet balance immediately. No delays, no approvals, no manual processing.'
    },
    {
      question: 'How do I withdraw my earnings?',
      answer: 'Go to your dashboard, click "Withdraw", enter your USDT wallet address, specify the amount, and submit. Withdrawals are processed manually by our admin team within 24-48 hours for security verification. Minimum withdrawal: 10 USDT. There are no withdrawal fees.'
    },
    {
      question: 'What if I can\'t recruit anyone?',
      answer: 'Then you won\'t earn commissions. Atlas Network is performance-based. We don\'t promise guaranteed returns. However, you still benefit if your downline recruits - even if you recruited no one directly, you earn from your sponsor\'s other recruits and their networks. The system rewards both direct effort and passive network growth.'
    },
    {
      question: 'Can I see proof this is real?',
      answer: 'Yes. Every transaction is recorded on the blockchain. You can verify all payments, all commission distributions, and all network structures. Your dashboard shows your complete earning history with transaction IDs. We also have live statistics showing total members, total paid out, and platform activity.'
    },
    {
      question: 'Why is it invitation-only?',
      answer: 'To maintain network quality and prevent abuse. We don\'t want spam accounts, bots, or people creating fake networks. Invitation-only ensures every member is vouched for by an existing member who has a stake in the platform\'s success. It also creates exclusivity and trust.'
    },
    {
      question: 'What happens if the platform shuts down?',
      answer: 'Your earnings are in your personal wallet - we can\'t touch them. However, future earning potential would stop. We are committed to long-term operation, but like any platform, there are risks. That\'s why we emphasize transparency and blockchain verification - you can always audit the platform\'s financial health yourself.'
    }
  ]

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-black bg-opacity-90 backdrop-blur-sm border-b border-white border-opacity-10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-display font-bold">Atlas Network</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl md:text-7xl font-display font-bold mb-6 leading-tight"
          >
            Build Wealth Through<br />Your Network
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Earn USDT cryptocurrency through unlimited-depth commission structure. Transparent, instant, and verified on the blockchain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" onClick={() => navigate('/login')}>
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
              How It Works
            </Button>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div>
              <div className="text-3xl font-bold font-display">Real-Time</div>
              <div className="text-gray-400 text-sm mt-1">USDT Payouts</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display">Unlimited</div>
              <div className="text-gray-400 text-sm mt-1">Network Depth</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display">100%</div>
              <div className="text-gray-400 text-sm mt-1">Transparent</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-display font-bold mb-4">Why Atlas Network?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The most advanced and transparent network marketing platform powered by blockchain technology
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-8 bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 hover:border-opacity-20 transition-all"
              >
                <div className="text-white mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-display font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to start earning</p>
          </motion.div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center text-3xl font-display font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-display font-bold mb-3">{step.title}</h3>
                  <p className="text-xl text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-display font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300">Everything you need to know</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="border border-white border-opacity-10 rounded-xl overflow-hidden"
              >
                <motion.button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  className="w-full text-left p-6 transition-all flex items-center justify-between"
                >
                  <span className="text-xl font-display font-semibold pr-8">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: activeFaq === index ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-2xl flex-shrink-0"
                  >
                    +
                  </motion.span>
                </motion.button>
                <motion.div
                  initial={false}
                  animate={{
                    height: activeFaq === index ? 'auto' : 0,
                    opacity: activeFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-gray-300 leading-relaxed text-lg">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-5xl font-display font-bold mb-6">Ready to Start Building?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of members already earning through Atlas Network
          </p>
          <Button size="lg" onClick={() => navigate('/login')}>
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-sm text-gray-400 mt-6">
            Invitation-only. Requires referral link from existing member.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white border-opacity-10 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2024 Atlas Network. All rights reserved.</p>
          <p className="mt-2">Blockchain-powered network marketing platform</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
