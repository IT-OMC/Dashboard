import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { fetchSheetData } from './api/dataService';
import type { Inquiry } from './api/dataService';
import {
  DollarSign,
  Ship,
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';


import Login from './components/Login';

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



  const filteredInquiries = useMemo(() => {
    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const currentYear = today.getFullYear();
    const currentDate = today.getDate();
    const currentMonthName = today.toLocaleString('default', { month: 'long' }).toUpperCase();

    const prevYear = yesterday.getFullYear();
    const prevDate = yesterday.getDate();
    const prevMonthName = yesterday.toLocaleString('default', { month: 'long' }).toUpperCase();

    return inquiries.filter(item => {
      const itemMonth = (item.month || '').toUpperCase();

      // Check if item matches Today
      const isToday = (
        item.year === currentYear &&
        item.date === currentDate &&
        itemMonth.includes(currentMonthName)
      );

      // Check if item matches Yesterday
      const isYesterday = (
        item.year === prevYear &&
        item.date === prevDate &&
        itemMonth.includes(prevMonthName)
      );

      return isToday || isYesterday;
    });
  }, [inquiries]);

  const stats = useMemo(() => {
    const totalQtnValue = filteredInquiries.reduce((acc, s) => acc + s.qtnValue, 0);
    const totalCost = filteredInquiries.reduce((acc, s) => acc + (s.qtnCost || 0), 0);
    const totalProfit = filteredInquiries.reduce((acc, s) => acc + s.qtnProfit, 0);
    const totalQtnMargin = filteredInquiries.reduce((acc, s) => acc + (s.qtnMargin || 0), 0);
    const totalInquiries = filteredInquiries.length;
    const confirmedOrders = filteredInquiries.filter(s => s.update === 'CONFIRMED').length;

    return { totalQtnValue, totalCost, totalProfit, totalQtnMargin, totalInquiries, confirmedOrders };
  }, [filteredInquiries]);

  // Auto-scroll to bottom of table when inquiries update
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [filteredInquiries]);





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
          <p style={{ color: '#94a3b8' }}>Real-time Operations Summary</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            background: '#1e293b',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'baseline',
            gap: '1rem',
            border: '1px solid #334155'
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: '#fff' }}>
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 500, color: '#94a3b8' }}>
              {currentTime.toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      {/* Stats Section: Split Layout */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', marginBottom: '1.5rem', flexShrink: 0 }}>

        {/* Left Column: Operational Metrics & Category Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Operational Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <StatCard
              label="Total Inquiries"
              value={stats.totalInquiries.toString()}
              icon={<ClipboardList color="#f59e0b" />}
            />
            <StatCard
              label="Confirmed Orders"
              value={stats.confirmedOrders.toString()}
              icon={<CheckCircle color="#10b981" />}
            />
            <StatCard
              label="Pending"
              value={filteredInquiries.filter(i => i.update === 'PENDING').length.toString()}
              icon={<Ship color="#3b82f6" />}
            />
            <StatCard
              label="Cancelled"
              value={filteredInquiries.filter(i => i.update === 'CANCELLED').length.toString()}
              icon={<Ship color="#ef4444" />}
            />
          </div>

          {/* Category Insights Section */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <CategoryCard
              label="PRO Outcomes"
              count={filteredInquiries.filter(i => i.category === 'PRO').length}
              total={stats.totalInquiries}
              color="#60a5fa"
              bg="rgba(59,130,246,0.15)"
            />
            <CategoryCard
              label="DEC Outcomes"
              count={filteredInquiries.filter(i => i.category === 'DEC').length}
              total={stats.totalInquiries}
              color="#fbbf24"
              bg="rgba(245,158,11,0.15)"
            />
            <CategoryCard
              label="ENG Outcomes"
              count={filteredInquiries.filter(i => i.category === 'ENG').length}
              total={stats.totalInquiries}
              color="#a78bfa"
              bg="rgba(139,92,246,0.15)"
            />
          </div>

        </div>

        {/* Right: Financial Summary Panel (Totals of N, O, P, Q) */}
        <div style={{
          background: '#1e293b',
          borderRadius: '1rem',
          border: '1px solid #334155',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} /> Financial Overview
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Total QTN Value</span>
              <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#60a5fa' }}>{formatCurrency(stats.totalQtnValue)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Total QTN Cost</span>
              <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#ef4444' }}>{formatCurrency(stats.totalCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Total Profit</span>
              <span style={{ fontWeight: 600, fontSize: '1.25rem', color: stats.totalProfit >= 0 ? '#10b981' : '#f87171' }}>{formatCurrency(stats.totalProfit)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Charts & Table Side-by-Side */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>

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
                  <th style={thStyle}>Op #</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Vessel</th>
                  <th style={thStyle}>Port</th>
                  <th style={thStyle}>Principal</th>
                  <th style={thStyle}>PIC</th>
                  <th style={thStyle}>Service</th>
                  <th style={thStyle}>Cat.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>QTN Cost</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Profit</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>QTN Margin</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Margin %</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((s, idx) => (
                  <tr key={`${s.rowNum} -${idx} `} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{s.folderNumber}</td>
                    <td style={tdStyle}>{s.date} {s.month}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#60a5fa' }}>{s.vesselName}</td>
                    <td style={tdStyle}>{s.port}</td>
                    <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.principal}</td>
                    <td style={tdStyle}>{s.pic}</td>
                    <td style={tdStyle}>{s.service}</td>
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
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(s.qtnCost)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: s.qtnProfit > 0 ? '#34d399' : s.qtnProfit < 0 ? '#f87171' : '#94a3b8' }}>
                      {s.qtnProfit > 0 ? '+' : ''}{formatCurrency(s.qtnProfit)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#cbd5e1' }}>{s.qtnMargin}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{s.marginPercent}%</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(s.update)} 20`,
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
      </div >
    </div >
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
    style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
  >
    <div style={{ padding: '0.6rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem' }}>
      {React.cloneElement(icon as any, { size: 20 })}
    </div>
    <div>
      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.15rem' }}>{label}</p>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{value}</p>
    </div>
  </motion.div>
);

const CategoryCard = ({ label, count, total, color, bg }: { label: string, count: number, total: number, color: string, bg: string }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px', background: bg, color: color }}>
          {percentage}%
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{count}</span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>inquiries</span>
      </div>
      <div style={{ height: '4px', width: '100%', background: '#334155', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}% `, background: color, borderRadius: '2px' }} />
      </div>
    </div>
  );
};

export default App;
