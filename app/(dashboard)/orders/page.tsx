'use client';

import React from 'react';
import { Order } from '../../../types/index';
import { MOCK_ORDERS } from '../../../utils/constants';

const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
  const statusClasses = {
    Completed: "bg-green-400/20 text-green-500",
    Processing: "bg-blue-400/20 text-blue-500",
    Cancelled: "bg-red-400/20 text-red-500",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const OrdersPage: React.FC = () => {
    const ordersData: Order[] = MOCK_ORDERS;

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md border border-border">
            <h1 className="text-3xl font-bold mb-6 text-card-foreground">Orders</h1>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-secondary">
                        <tr>
                            <th className="p-4 font-semibold text-muted-foreground">Order ID</th>
                            <th className="p-4 font-semibold text-muted-foreground">Customer</th>
                            <th className="p-4 font-semibold text-muted-foreground hidden lg:table-cell">Product</th>
                            <th className="p-4 font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="p-4 font-semibold text-muted-foreground hidden sm:table-cell">Amount</th>
                            <th className="p-4 font-semibold text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordersData.length > 0 ? (
                            ordersData.map(order => (
                                <tr key={order.id} className="border-b border-border hover:bg-secondary">
                                    <td className="p-4 text-primary-500 font-mono text-sm">{order.id}</td>
                                    <td className="p-4 text-card-foreground font-medium">{order.customerName}</td>
                                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{order.productName}</td>
                                    <td className="p-4 text-muted-foreground hidden md:table-cell">{order.orderDate}</td>
                                    <td className="p-4 text-card-foreground hidden sm:table-cell">${order.amount.toFixed(2)}</td>
                                    <td className="p-4">
                                        <StatusBadge status={order.status} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersPage;


