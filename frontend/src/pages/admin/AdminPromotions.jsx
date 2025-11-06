import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { adminAPI } from '../../services/api';
import { PlusCircle, Edit, Trash2, Gift } from 'lucide-react';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await adminAPI.getPromotions();
      setPromotions(response.data.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentPromotion({
      name: '',
      description: '',
      type: 'referral_milestone',
      rules: { referrals_required: 10 },
      reward_amount: 100,
      is_active: false,
    });
    setShowModal(true);
  };

  const handleEdit = (promo) => {
    setCurrentPromotion(promo);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await adminAPI.deletePromotion(id);
        fetchPromotions();
      } catch (error) {
        console.error('Error deleting promotion:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (currentPromotion.id) {
        await adminAPI.updatePromotion(currentPromotion.id, currentPromotion);
      } else {
        await adminAPI.createPromotion(currentPromotion);
      }
      fetchPromotions();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading promotions...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-display font-bold text-white">Promotions</h1>
          <Button onClick={handleCreate}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Promotion
          </Button>
        </div>

        <Card padding="lg">
          <div className="space-y-4">
            {promotions.map((promo) => (
              <motion.div
                key={promo.id}
                className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl"
              >
                <div>
                  <h3 className="text-white font-bold">{promo.name}</h3>
                  <p className="text-gray-400 text-sm">{promo.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      promo.is_active ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(promo)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(promo.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg w-full max-w-lg">
              <h2 className="text-2xl font-bold text-white mb-6">
                {currentPromotion.id ? 'Edit' : 'Create'} Promotion
              </h2>
              <div className="space-y-4">
                <Input
                  label="Name"
                  value={currentPromotion.name}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, name: e.target.value })}
                />
                <Input
                  label="Description"
                  value={currentPromotion.description}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, description: e.target.value })}
                />
                <Input
                  label="Reward Amount (USDT)"
                  type="number"
                  value={currentPromotion.reward_amount}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, reward_amount: e.target.value })}
                />
                <Input
                  label="Referrals Required"
                  type="number"
                  value={currentPromotion.rules.referrals_required}
                  onChange={(e) =>
                    setCurrentPromotion({
                      ...currentPromotion,
                      rules: { ...currentPromotion.rules, referrals_required: parseInt(e.target.value) },
                    })
                  }
                />
                <div className="flex items-center gap-4">
                  <label className="text-white">Active</label>
                  <input
                    type="checkbox"
                    checked={currentPromotion.is_active}
                    onChange={(e) =>
                      setCurrentPromotion({ ...currentPromotion, is_active: e.target.checked })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPromotions;
