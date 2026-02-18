import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchSheetData } from './api/dataService';
import type { Shipment } from './api/dataService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, Activity, Download, Ship, Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const App: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSheetData();
      setShipments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [loadData]);

  const stats = useMemo(() => {
    const totalRevenue = shipments.reduce((acc, s) => acc + s.revenue, 0);
    const totalCost = shipments.reduce((acc, s) => acc + s.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgEfficiency = shipments.length > 0
      ? (shipments.reduce((acc, s) => acc + s.fuelEfficiency, 0) / shipments.length).toFixed(2)
      : 0;
    const totalPayload = shipments.reduce((acc, s) => acc + s.payloadTeu, 0);

    return { totalRevenue, totalCost, totalProfit, avgEfficiency, totalPayload };
  }, [shipments]);

  const profitData = useMemo(() => {
    return shipments.map(s => ({
      name: s.vesselName,
      Profit: s.profit,
      Revenue: s.revenue,
      Cost: s.cost
    }));
  }, [shipments]);

  const payloadData = useMemo(() => {
    return shipments.map(s => ({
      name: s.vesselName,
      value: s.payloadTeu
    }));
  }, [shipments]);

  const handleDownload = () => {
    const csv = Papa.unparse(shipments);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shipping_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ color: '#3b82f6' }}
      >
        <Ship size={48} />
      </motion.div>
    </div>
  );

  return (
    <div className="dashboard-container" style={{ padding: '2rem', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ship className="text-blue-500" /> Shipping Operations Dashboard
          </h1>
          <p style={{ color: '#94a3b8' }}>Real-time Fleet Performance • {currentTime.toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Download size={18} /> Export Data
          </button>
          <div style={{ background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard
          label="Total Net Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={<DollarSign size={24} color={stats.totalProfit >= 0 ? '#10b981' : '#ef4444'} />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp size={24} color="#3b82f6" />}
        />
        <StatCard
          label="Avg Fuel Efficiency"
          value={`${stats.avgEfficiency} MT/nm`}
          icon={<Activity size={24} color="#f59e0b" />}
        />
        <StatCard
          label="Total Payload"
          value={`${stats.totalPayload.toLocaleString()} TEU`}
          icon={<Package size={24} color="#8b5cf6" />}
        />
      </section>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Financial Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #334155' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="#3b82f6" /> Financial Performance by Vessel
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Legend />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payload Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #334155' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="#8b5cf6" /> Cargo Load Distribution (TEU)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={payloadData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {payloadData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Data Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #334155', overflowX: 'auto' }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Detailed Shipment Records</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left' }}>
              <th style={{ padding: '1rem', color: '#94a3b8' }}>ID</th>
              <th style={{ padding: '1rem', color: '#94a3b8' }}>Date</th>
              <th style={{ padding: '1rem', color: '#94a3b8' }}>Vessel</th>
              <th style={{ padding: '1rem', color: '#94a3b8' }}>Route</th>
              <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>Payload (TEU)</th>
              <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>Revenue</th>
              <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>Profit/Loss</th>
              <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s, idx) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{s.id}</td>
                <td style={{ padding: '1rem', color: '#cbd5e1' }}>{s.date}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#60a5fa' }}>{s.vesselName}</td>
                <td style={{ padding: '1rem' }}>{s.origin} <span style={{ color: '#64748b' }}>➔</span> {s.destination}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>{s.payloadTeu.toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(s.revenue)}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: s.profit >= 0 ? '#34d399' : '#f87171' }}>
                  {s.profit > 0 ? '+' : ''}{formatCurrency(s.profit)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>{s.fuelEfficiency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '1rem' }}
  >
    <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.75rem' }}>
      {icon}
    </div>
    <div>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{value}</p>
    </div>
  </motion.div>
);

export default App;
