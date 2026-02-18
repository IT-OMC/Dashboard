import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { fetchSheetData } from './api/dataService';
import type { Inquiry } from './api/dataService';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  DollarSign, TrendingUp, Download, Ship, ClipboardList, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';

import Login from './components/Login';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const REFRESH_INTERVAL = 20 * 1000; // 20 seconds

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#10b981',
  PENDING: '#f59e0b',
  SENT: '#3b82f6',
  CANCELLED: '#ef4444',
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dashboard_auth') === 'true';
  });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => {
    localStorage.setItem('dashboard_auth', 'true');
    setIsAuthenticated(true);
  };

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSheetData();
      setInquiries(data);
    } catch (err: any) {
      console.error(err.message);
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
    const totalQtnValue = inquiries.reduce((acc, s) => acc + s.qtnValue, 0);
    const totalProfit = inquiries.reduce((acc, s) => acc + s.qtnProfit, 0);
    const totalInquiries = inquiries.length;
    const confirmedOrders = inquiries.filter(s => s.update === 'CONFIRMED').length;

    return { totalQtnValue, totalProfit, totalInquiries, confirmedOrders };
  }, [inquiries]);

  // Auto-scroll to bottom of table when inquiries update
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [inquiries]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    inquiries.forEach(s => {
      const status = s.update || 'UNKNOWN';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const financialData = useMemo(() => {
    const grouped: Record<string, { name: string; Cost: number; Profit: number; Revenue: number }> = {};
    inquiries.forEach(s => {
      const key = s.vesselName || 'Unknown';
      if (!grouped[key]) {
        grouped[key] = { name: key, Cost: 0, Profit: 0, Revenue: 0 };
      }
      grouped[key].Cost += s.qtnCost;
      grouped[key].Profit += s.qtnProfit;
      grouped[key].Revenue += s.qtnValue;
    });
    return Object.values(grouped)
      .sort((a, b) => b.Revenue - a.Revenue)
      .slice(0, 10);
  }, [inquiries]);

  const handleDownload = () => {
    const csv = Papa.unparse(inquiries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inquiry_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || '#94a3b8';

  if (!isAuthenticated && !loading) {
    return <Login onLogin={handleLogin} />;
  }

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
    <div className="dashboard-container" style={{ padding: '1.5rem', background: '#0f172a', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ship className="text-blue-500" /> Operational Dashboard
          </h1>
          <p style={{ color: '#94a3b8' }}>Real-time Operations Summary • {currentTime.toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.25rem', background: '#3b82f6', color: 'white',
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <StatCard
          label="Total QTN Value"
          value={formatCurrency(stats.totalQtnValue)}
          icon={<DollarSign size={24} color="#3b82f6" />}
        />
        <StatCard
          label="Total Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={<TrendingUp size={24} color={stats.totalProfit >= 0 ? '#10b981' : '#ef4444'} />}
        />
        <StatCard
          label="Total Inquiries"
          value={stats.totalInquiries.toString()}
          icon={<ClipboardList size={24} color="#f59e0b" />}
        />
        <StatCard
          label="Confirmed Orders"
          value={stats.confirmedOrders.toString()}
          icon={<CheckCircle size={24} color="#10b981" />}
        />
      </section>

      {/* Main Content Area: Charts & Table Side-by-Side */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Charts Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '38%', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {/* Quotation Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #334155', flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} color="#3b82f6" /> Inquiry Status
            </h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ cx, cy, midAngle = 0, outerRadius: oR, name, value, percent = 0 }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = oR + 30;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const totalPct = (percent * 100).toFixed(0);
                      return (
                        <text x={x} y={y} fill="#e2e8f0" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600}>
                          {`${name} ${value} (${totalPct}%)`}
                        </text>
                      );
                    }}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Financial Performance */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #334155', flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="#3b82f6" /> Financial Performance
            </h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '0.5rem' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Cost" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Profit" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Data Grid Column */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: '#1e293b',
            borderRadius: '1rem',
            border: '1px solid #334155',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Inquiry Records</h3>
          </div>

          <div ref={tableContainerRef} style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, scrollBehavior: 'smooth' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>
                <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Vessel</th>
                  <th style={thStyle}>Port</th>
                  <th style={thStyle}>Principal</th>
                  <th style={thStyle}>Cat.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>QTN Value</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Profit</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Margin %</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((s, idx) => (
                  <tr key={`${s.rowNum}-${idx}`} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{s.rowNum}</td>
                    <td style={{ ...tdStyle, color: '#cbd5e1' }}>{s.date}/{s.month?.replace(/^\d+\.\s*/, '')?.slice(0, 3)}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#60a5fa' }}>{s.vesselName}</td>
                    <td style={tdStyle}>{s.port}</td>
                    <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.principal}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: s.category === 'PRO' ? 'rgba(59,130,246,0.15)' : s.category === 'DEC' ? 'rgba(245,158,11,0.15)' : s.category === 'ENG' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.1)',
                        color: s.category === 'PRO' ? '#60a5fa' : s.category === 'DEC' ? '#fbbf24' : s.category === 'ENG' ? '#a78bfa' : '#94a3b8',
                      }}>
                        {s.category}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(s.qtnValue)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: s.qtnProfit > 0 ? '#34d399' : s.qtnProfit < 0 ? '#f87171' : '#94a3b8' }}>
                      {s.qtnProfit > 0 ? '+' : ''}{formatCurrency(s.qtnProfit)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{s.marginPercent}%</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(s.update)}20`,
                        color: getStatusColor(s.update),
                      }}>
                        {s.update}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem',
  color: '#94a3b8',
  whiteSpace: 'nowrap',
  background: '#1e293b',
  fontSize: '0.875rem',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  fontSize: '0.875rem',
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
