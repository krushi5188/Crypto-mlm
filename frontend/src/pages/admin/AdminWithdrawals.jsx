import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { Eye, Check, X } from 'lucide-react';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            const res = await adminAPI.getWithdrawals();
            setWithdrawals(res.data.withdrawals);
        } catch (error) {
            console.error("Failed to fetch withdrawals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await adminAPI.updateWithdrawalStatus(id, { status: 'approved' });
            fetchWithdrawals();
        } catch (error) {
            console.error("Failed to approve withdrawal", error);
        }
    };

    const handleReject = async (id) => {
        try {
            await adminAPI.updateWithdrawalStatus(id, { status: 'rejected' });
            fetchWithdrawals();
        } catch (error) {
            console.error("Failed to reject withdrawal", error);
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-6">Withdrawal Requests</h1>

                <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <table className="min-w-full text-white">
                        <thead>
                            <tr className="bg-gray-700">
                                <th className="py-3 px-4 text-left">User</th>
                                <th className="py-3 px-4 text-left">Amount</th>
                                <th className="py-3 px-4 text-left">Wallet Address</th>
                                <th className="py-3 px-4 text-left">Chain</th>
                                <th className="py-3 px-4 text-left">Date</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((w) => (
                                <tr key={w.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="py-3 px-4">{w.username}</td>
                                    <td className="py-3 px-4">{w.amount} USDT</td>
                                    <td className="py-3 px-4">{w.wallet_address}</td>
                                    <td className="py-3 px-4">{w.chain}</td>
                                    <td className="py-3 px-4">{new Date(w.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-center">{w.status}</td>
                                    <td className="py-3 px-4 text-center">
                                        {w.status === 'pending' && (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleApprove(w.id)} className="p-2 bg-green-500 rounded-full hover:bg-green-600"><Check size={16} /></button>
                                                <button onClick={() => handleReject(w.id)} className="p-2 bg-red-500 rounded-full hover:bg-red-600"><X size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminWithdrawals;
