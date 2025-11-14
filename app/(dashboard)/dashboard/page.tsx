'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { useTheme } from '../../../hooks/useTheme';
import { StatCard } from '../../../components/dashboard/StatCard';
import { ChartCard } from '../../../components/dashboard/ChartCard';
import { DataTable, Column } from '../../../components/dashboard/DataTable';
import { AnalyticsPanel } from '../../../components/dashboard/AnalyticsPanel';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { 
  ContactsIcon, UsersIcon, PlansIcon, TrendingUpIcon, 
  DollarIcon, DownloadIcon, RefreshIcon, SearchIcon 
} from '../../../components/icons/IconComponents';
import { 
  fetchAnalyticsStats, 
  fetchContactsByStatus, 
  fetchContactsByIndustry,
  fetchTopCompanies,
  exportToCSV 
} from '../../../services/analytics';
import { fetchContacts } from '../../../services/contact';
import type { Contact } from '../../../types';

// Mock data for additional tables
const MOCK_ORDERS = [
  { id: 'ORD-001', customer: 'Acme Corp', amount: '$5,200', status: 'Completed', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'TechStart Inc', amount: '$3,800', status: 'Pending', date: '2024-01-14' },
  { id: 'ORD-003', customer: 'Global Solutions', amount: '$7,500', status: 'Completed', date: '2024-01-13' },
  { id: 'ORD-004', customer: 'Innovation Labs', amount: '$2,100', status: 'Processing', date: '2024-01-12' },
  { id: 'ORD-005', customer: 'Digital Ventures', amount: '$4,900', status: 'Completed', date: '2024-01-11' },
];

const MOCK_ACTIVITIES = [
  { id: 1, action: 'New contact added', user: 'John Doe', time: '5 minutes ago', type: 'success' },
  { id: 2, action: 'Deal closed', user: 'Jane Smith', time: '1 hour ago', type: 'success' },
  { id: 3, action: 'Meeting scheduled', user: 'Bob Johnson', time: '2 hours ago', type: 'info' },
  { id: 4, action: 'Email sent', user: 'Alice Brown', time: '3 hours ago', type: 'default' },
  { id: 5, action: 'Task completed', user: 'Charlie Wilson', time: '5 hours ago', type: 'success' },
];

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    newContactsThisMonth: 0,
    activeCustomers: 0,
    revenueThisMonth: 0,
    growthRate: 0,
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [industryData, setIndustryData] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [statsData, contactsData, statusResponse, industryResponse, companiesData] = await Promise.all([
        fetchAnalyticsStats(),
        fetchContacts({ limit: 10, sortColumn: 'created_at', sortDirection: 'desc' }),
        fetchContactsByStatus(),
        fetchContactsByIndustry(5),
        fetchTopCompanies(5),
      ]);

      setStats(statsData);
      setContacts(contactsData.contacts || []);
      setStatusData(statusResponse);
      setIndustryData(industryResponse);
      setTopCompanies(companiesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportContacts = () => {
    exportToCSV(contacts, 'contacts-export');
  };

  const handleExportOrders = () => {
    exportToCSV(MOCK_ORDERS, 'orders-export');
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

  // Contact table columns
  const contactColumns: Column<Contact>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'Customer' ? 'success' : value === 'Lead' ? 'glass-primary' : 'default'} size="sm">
          {value}
        </Badge>
      )
    },
  ];

  // Orders table columns
  const orderColumns: Column<typeof MOCK_ORDERS[0]>[] = [
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge 
          variant={
            value === 'Completed' ? 'success' : 
            value === 'Pending' ? 'warning' : 
            'glass-primary'
          } 
          size="sm"
        >
          {value}
        </Badge>
      )
    },
    { key: 'date', label: 'Date', sortable: true },
  ];

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-content">
          <div className="dashboard-header-text">
            <h1 className="dashboard-header-title">
              Welcome back! 👋
            </h1>
            <p className="dashboard-header-description">
              Here&apos;s what&apos;s happening with your business today
            </p>
          </div>
          <div className="dashboard-header-actions">
            <Button 
              variant="glass" 
              leftIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              glow
            >
              Refresh
            </Button>
            <Button 
              variant="glass-primary" 
              leftIcon={<DownloadIcon />}
              onClick={handleExportContacts}
              glow
            >
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Contacts"
          value={loading ? '...' : stats.totalContacts.toLocaleString()}
          icon={<ContactsIcon />}
          color="primary"
          trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
          variant="glass-hover"
          loading={loading}
        />
        <StatCard
          title="New Leads This Month"
          value={loading ? '...' : stats.newContactsThisMonth.toLocaleString()}
          icon={<UsersIcon />}
          color="info"
          trend={{ value: 12.5, isPositive: true }}
          variant="glass-hover"
          loading={loading}
        />
        <StatCard
          title="Active Customers"
          value={loading ? '...' : stats.activeCustomers.toLocaleString()}
          icon={<PlansIcon />}
          color="success"
          trend={{ value: 8.2, isPositive: true }}
          variant="glass-hover"
          loading={loading}
        />
        <StatCard
          title="Revenue This Month"
          value={loading ? '...' : `$${stats.revenueThisMonth.toLocaleString()}`}
          icon={<DollarIcon />}
          color="warning"
          trend={{ value: 15.3, isPositive: true }}
          variant="glass-hover"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts-grid">
        <ChartCard 
          title="Contact Status Distribution" 
          subtitle="Breakdown by status"
          variant="glass"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={statusData} 
                dataKey="count" 
                nameKey="status" 
                cx="50%" 
                cy="50%" 
                outerRadius={100}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                labelLine={{ stroke: tickColor }}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card) / 0.9)',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Top Industries" 
          subtitle="By contact count"
          variant="glass"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={industryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis 
                dataKey="industry" 
                stroke={tickColor}
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={tickColor} style={{ fontSize: '12px' }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card) / 0.9)',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Contacts Table */}
      <AnalyticsPanel
        title="Recent Contacts"
        variant="glass"
        actions={
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<SearchIcon />}
            variant="glass"
            style={{ width: '16rem' }}
          />
        }
      >
        <DataTable
          columns={contactColumns}
          data={contacts.filter(c => 
            searchQuery === '' || 
            `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          variant="glass"
          hoverable
          loading={loading}
          emptyMessage="No contacts found"
        />
      </AnalyticsPanel>

      {/* Additional Data Sections */}
      <div className="dashboard-additional-sections">
        {/* Top Companies */}
        <AnalyticsPanel title="Top Companies" variant="glass">
          <div className="dashboard-additional-section-content">
            {topCompanies.map((company, index) => (
              <div 
                key={index} 
                className="top-companies-item"
              >
                <div className="top-companies-item-content">
                  <div className="top-companies-item-number">
                    {index + 1}
                  </div>
                  <div className="top-companies-item-info">
                    <p className="top-companies-item-name">{company.name}</p>
                    <p className="top-companies-item-details">
                      {company.contactCount} contact{company.contactCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant="glass-primary" size="sm">
                  {company.employeeCount.toLocaleString()} employees
                </Badge>
              </div>
            ))}
          </div>
        </AnalyticsPanel>

        {/* Recent Activity */}
        <AnalyticsPanel title="Recent Activity" variant="glass">
          <div className="dashboard-additional-section-content">
            {MOCK_ACTIVITIES.map((activity) => (
              <div 
                key={activity.id} 
                className="recent-activity-item"
              >
                <div className={`recent-activity-indicator ${
                  activity.type === 'success' ? 'recent-activity-indicator--success' :
                  activity.type === 'info' ? 'recent-activity-indicator--info' :
                  'recent-activity-indicator--default'
                }`} />
                <div className="recent-activity-content">
                  <p className="recent-activity-action">{activity.action}</p>
                  <p className="recent-activity-meta">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsPanel>
      </div>

      {/* Orders Table */}
      <AnalyticsPanel
        title="Recent Orders"
        variant="glass"
        actions={
          <Button 
            variant="glass" 
            size="sm"
            leftIcon={<DownloadIcon />}
            onClick={handleExportOrders}
          >
            Export
          </Button>
        }
      >
        <DataTable
          columns={orderColumns}
          data={MOCK_ORDERS}
          variant="glass"
          hoverable
          striped
        />
      </AnalyticsPanel>
    </div>
  );
};

export default Dashboard;

