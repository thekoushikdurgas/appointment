
import { Plan, ChartData, Contact, ExportHistory, Order } from '@/types/index';

export const MOCK_CONTACTS: Contact[] = [
  { uuid: '1', name: 'John Doe', email: 'john.d@example.com', company: 'Example Corp', phone: '123-456-7890', status: 'Customer', avatarUrl: 'https://picsum.photos/seed/1/40/40', title: 'CEO', city: 'San Francisco', state: 'CA', country: 'USA', website: 'https://example.com', personLinkedinUrl: 'https://linkedin.com/in/johndoe', tags: 'tech,saas,ceo', notes: 'Met at the 2024 Tech Conference. Follow up regarding enterprise package.' },
  { uuid: '2', name: 'Jane Smith', email: 'jane.s@example.com', company: 'Innovate LLC', phone: '234-567-8901', status: 'Lead', avatarUrl: 'https://picsum.photos/seed/2/40/40', title: 'Marketing Manager', city: 'New York', state: 'NY', country: 'USA', website: 'https://innovate.com', personLinkedinUrl: 'https://linkedin.com/in/janesmith', tags: 'marketing,b2b', notes: 'Interested in our analytics tools. Scheduled a demo for next week.' },
  { uuid: '3', name: 'Sam Wilson', email: 'sam.w@example.com', company: 'Tech Solutions', phone: '345-678-9012', status: 'Customer', avatarUrl: 'https://picsum.photos/seed/3/40/40', title: 'CTO', city: 'Austin', state: 'TX', country: 'USA', website: 'https://techsolutions.io', personLinkedinUrl: 'https://linkedin.com/in/samwilson', tags: 'dev,api,cto', notes: 'Long-time customer, very satisfied with the service.' },
  { uuid: '4', name: 'Alice Johnson', email: 'alice.j@example.com', company: 'Creative Minds', phone: '456-789-0123', status: 'Lead', avatarUrl: 'https://picsum.photos/seed/4/40/40', title: 'Product Designer', city: 'Los Angeles', state: 'CA', country: 'USA', website: 'https://creativeminds.design', personLinkedinUrl: 'https://linkedin.com/in/alicejohnson', tags: 'ui,ux,design', notes: 'Downloaded our free design kit. Potential for a starter plan subscription.' },
  { uuid: '5', name: 'Bob Brown', email: 'bob.b@example.com', company: 'Data Systems', phone: '567-890-1234', status: 'Archived', avatarUrl: 'https://picsum.photos/seed/5/40/40', title: 'Data Analyst', city: 'Chicago', state: 'IL', country: 'USA', website: 'https://datasys.co', personLinkedinUrl: 'https://linkedin.com/in/bobbrown', tags: 'data,analytics', notes: 'No longer with the company. Archived on 2024-07-01.' },
];

export const MOCK_PLANS: Plan[] = [
  { name: 'Starter', price: '$49/mo', features: ['1,000 Contacts', 'Basic Analytics', 'Email Support'], isCurrent: false },
  { name: 'Professional', price: '$99/mo', features: ['5,000 Contacts', 'Advanced Analytics', 'User Management', 'Priority Support'], isCurrent: true },
  { name: 'Enterprise', price: 'Custom', features: ['Unlimited Contacts', 'Full Analytics Suite', 'Dedicated Account Manager', 'API Access'], isCurrent: false },
];

export const CONTACT_GROWTH_DATA: ChartData[] = [
  { name: 'Jan', value: 200 }, { name: 'Feb', value: 240 }, { name: 'Mar', value: 290 },
  { name: 'Apr', value: 350 }, { name: 'May', value: 410 }, { name: 'Jun', value: 480 },
];

export const SUBSCRIPTION_TIER_DATA: ChartData[] = [
  { name: 'Starter', value: 45 }, { name: 'Professional', value: 35 }, { name: 'Enterprise', value: 20 },
];

export const MOCK_EXPORT_HISTORY: ExportHistory[] = [
    { id: 1, fileName: 'all_contacts_2024-07-28.csv', exportDate: '2024-07-28 10:30 AM', records: 1250, status: 'Completed', downloadUrl: '#' },
    { id: 2, fileName: 'leads_export_2024-07-27.csv', exportDate: '2024-07-27 02:15 PM', records: 320, status: 'Completed', downloadUrl: '#' },
    { id: 3, fileName: 'customer_data_2024-07-25.csv', exportDate: '2024-07-25 09:00 AM', records: 930, status: 'Failed', downloadUrl: '#' },
    { id: 4, fileName: 'monthly_backup_2024-06-30.csv', exportDate: '2024-06-30 11:59 PM', records: 5400, status: 'Completed', downloadUrl: '#' },
    { id: 5, fileName: 'new_leads_export_2024-07-29.csv', exportDate: '2024-07-29 08:00 AM', records: 50, status: 'Processing', downloadUrl: '#' },
];

export const MOCK_ORDERS: Order[] = [
    { id: 'ORD-001', customerName: 'John Doe', productName: 'Professional Plan', orderDate: '2024-07-29', amount: 99.00, status: 'Completed' },
    { id: 'ORD-002', customerName: 'Jane Smith', productName: 'Starter Plan', orderDate: '2024-07-28', amount: 49.00, status: 'Completed' },
    { id: 'ORD-003', customerName: 'Sam Wilson', productName: 'Enterprise Plan', orderDate: '2024-07-27', amount: 500.00, status: 'Processing' },
    { id: 'ORD-004', customerName: 'Alice Johnson', productName: 'Starter Plan', orderDate: '2024-07-26', amount: 49.00, status: 'Cancelled' },
    { id: 'ORD-005', customerName: 'Bob Brown', productName: 'Professional Plan', orderDate: '2024-07-25', amount: 99.00, status: 'Completed' },
];


