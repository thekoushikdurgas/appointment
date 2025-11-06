'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_PLANS } from '../../../../utils/constants';
import { ShieldCheckIcon } from '../../../../components/icons/IconComponents';

const BillingSettings: React.FC = () => {
    const currentPlan = MOCK_PLANS.find(p => p.isCurrent);
  
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-card-foreground">Billing</h2>
        
        {currentPlan ? (
          <div className="border border-border rounded-lg p-6 space-y-4 bg-secondary">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <p className="text-3xl font-bold text-primary-500">{currentPlan.name}</p>
                <p className="text-xl font-semibold text-card-foreground">{currentPlan.price}</p>
              </div>
              <Link 
                href="/plans"
                className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors self-start sm:self-auto"
              >
                Manage Subscription
              </Link>
            </div>
            
            <ul className="space-y-3 text-muted-foreground pt-4 border-t border-border">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <ShieldCheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
  
          </div>
        ) : (
          <p className="text-muted-foreground">You are not subscribed to any plan.</p>
        )}
      </div>
    );
};

export default BillingSettings;

