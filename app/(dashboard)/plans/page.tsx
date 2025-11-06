'use client';

import React, { useState } from 'react';
import { MOCK_PLANS } from '../../../utils/constants';
import { Plan } from '../../../types/index';

const ConfirmationModal: React.FC<{
  plan: Plan | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ plan, onConfirm, onCancel }) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border border-border">
        <h2 className="text-xl font-bold mb-4 text-card-foreground">Confirm Plan Change</h2>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to switch to the <span className="font-bold text-foreground">{plan.name}</span> plan for {plan.price}?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleChoosePlan = (planToChoose: Plan) => {
    setSelectedPlan(planToChoose);
  };

  const handleConfirmSwitch = () => {
    if (!selectedPlan) return;
    
    const updatedPlans = plans.map(p => ({
      ...p,
      isCurrent: p.name === selectedPlan.name,
    }));
    setPlans(updatedPlans);
    setSelectedPlan(null);
  };

  const handleCancelSwitch = () => {
    setSelectedPlan(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-foreground">Subscription Plans</h1>
      <p className="text-muted-foreground mb-8">Choose the plan that's right for your business.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div 
            key={plan.name}
            className={`bg-card p-8 rounded-lg shadow-lg border-2 transition-transform transform hover:-translate-y-2 ${plan.isCurrent ? 'border-primary-500' : 'border-border'}`}
          >
            <h2 className="text-2xl font-bold mb-2 text-card-foreground">{plan.name}</h2>
            <p className="text-4xl font-extrabold mb-6 text-card-foreground">{plan.price}</p>
            
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-muted-foreground">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => !plan.isCurrent && handleChoosePlan(plan)}
              disabled={plan.isCurrent}
              className={`w-full py-3 font-bold rounded-lg transition-colors ${
                plan.isCurrent 
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {plan.isCurrent ? 'Current Plan' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      <ConfirmationModal
        plan={selectedPlan}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </div>
  );
};

export default Plans;


