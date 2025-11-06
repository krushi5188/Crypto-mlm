import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { memberAPI } from '../../services/api';
import Button from '../base/Button';

const PromotionsBanner = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await memberAPI.getPromotions();
      setPromotions(response.data.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (id) => {
    try {
      await memberAPI.signupForPromotion(id);
      // Remove the promotion from the list after signing up
      setPromotions(promotions.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error signing up for promotion:', error);
    }
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  return (
    <div className="bg-purple-600 text-white p-4 rounded-lg mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Gift className="w-8 h-8" />
          <div>
            <h3 className="font-bold">Active Promotions!</h3>
            <p className="text-sm">
              Check out the current promotions and sign up to earn extra rewards.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {promotions.map((promo) => (
          <motion.div
            key={promo.id}
            className="bg-purple-700 p-4 rounded-lg flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold">{promo.name}</h4>
              <p className="text-sm">{promo.description}</p>
            </div>
            <Button size="sm" onClick={() => handleSignup(promo.id)}>
              Sign Up
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsBanner;
