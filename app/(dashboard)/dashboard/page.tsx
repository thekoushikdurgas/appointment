'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_CONTACTS, CONTACT_GROWTH_DATA, SUBSCRIPTION_TIER_DATA } from '../../../utils/constants';
import { ContactsIcon, UsersIcon, PlansIcon } from '../../../components/icons/IconComponents';
import { useTheme } from '../../../hooks/useTheme';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-card p-6 rounded-lg shadow-md flex items-center border border-border">
    <div className={`p-4 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold text-card-foreground">{value}</p>
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card p-6 rounded-lg shadow-md border border-border">
    <h3 className="text-xl font-semibold mb-4 text-card-foreground">{title}</h3>
    <div className="w-full h-72">
      {children}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];
  const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Total Contacts" value={MOCK_CONTACTS.length.toString()} icon={<ContactsIcon className="w-8 h-8 text-white"/>} color="bg-primary-600" />
        <KpiCard title="New Leads" value={MOCK_CONTACTS.filter(c => c.status === 'Lead').length.toString()} icon={<UsersIcon className="w-8 h-8 text-white"/>} color="bg-purple-600" />
        <KpiCard title="Active Customers" value={MOCK_CONTACTS.filter(c => c.status === 'Customer').length.toString()} icon={<PlansIcon className="w-8 h-8 text-white"/>} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Contact Growth">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CONTACT_GROWTH_DATA} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={tickColor} />
              <YAxis stroke={tickColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="New Contacts"/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription Tiers">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={SUBSCRIPTION_TIER_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={{ fill: tickColor }}>
                {SUBSCRIPTION_TIER_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;


