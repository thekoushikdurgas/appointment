'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_CONTACTS, CONTACT_GROWTH_DATA, SUBSCRIPTION_TIER_DATA } from '../../../utils/constants';
import { ContactsIcon, UsersIcon, PlansIcon, TrendingUpIcon } from '../../../components/icons/IconComponents';
import { useTheme } from '../../../hooks/useTheme';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => (
  <Card variant="elevated" padding="lg" className="hover-lift transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-sm text-success">
            <TrendingUpIcon className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  </Card>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card variant="elevated" padding="lg" className="h-full">
    <CardHeader className="pb-4">
      <CardTitle className="text-xl font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="w-full h-64 sm:h-72">
        {children}
      </div>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];
  const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <div className="dashboard-page">
      {/* <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
      </div> */}
      
      <div className="dashboard-stats">
        <KpiCard 
          title="Total Contacts" 
          value={MOCK_CONTACTS.length.toString()} 
          icon={<ContactsIcon className="w-8 h-8 text-white"/>} 
          color="bg-primary" 
          trend="+12% this month"
        />
        <KpiCard 
          title="New Leads" 
          value={MOCK_CONTACTS.filter(c => c.status === 'Lead').length.toString()} 
          icon={<UsersIcon className="w-8 h-8 text-white"/>} 
          color="bg-purple-600" 
          trend="+8% this month"
        />
        <KpiCard 
          title="Active Customers" 
          value={MOCK_CONTACTS.filter(c => c.status === 'Customer').length.toString()} 
          icon={<PlansIcon className="w-8 h-8 text-white"/>} 
          color="bg-emerald-600" 
          trend="+5% this month"
        />
      </div>

      <div className="dashboard-charts">
        <ChartCard title="Contact Growth">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CONTACT_GROWTH_DATA} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--muted))'} />
              <XAxis 
                dataKey="name" 
                stroke={tickColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={tickColor}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? 'hsl(var(--card))' : 'hsl(var(--card))',
                  borderColor: theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: theme === 'dark' ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                name="New Contacts"
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription Tiers">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={SUBSCRIPTION_TIER_DATA} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={80}
                label={{ fill: tickColor, fontSize: '12px' }}
              >
                {SUBSCRIPTION_TIER_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? 'hsl(var(--card))' : 'hsl(var(--card))',
                  borderColor: theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: theme === 'dark' ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;


