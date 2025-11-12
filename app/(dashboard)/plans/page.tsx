'use client';

import React, { useState } from 'react';
import { MOCK_PLANS } from '../../../utils/constants';
import { Plan } from '../../../types/index';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PlansIcon, CheckIcon, XMarkIcon, DollarIcon, StarIcon } from '../../../components/icons/IconComponents';
import { cn } from '../../../utils/cn';

const ConfirmationModal: React.FC<{
  plan: Plan | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ plan, onConfirm, onCancel }) => {
  if (!plan) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md">
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Confirm Plan Change</h2>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onCancel}
              aria-label="Close"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="modal-body">
          <p className="text-muted-foreground">
            Are you sure you want to switch to the <span className="font-bold text-foreground">{plan.name}</span> plan for {plan.price}?
          </p>
        </div>
        <div className="modal-footer">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm
          </Button>
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
    <div className="flex flex-col gap-6 w-full max-w-full">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <PlansIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose the plan that&apos;s right for your business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card
            key={plan.name}
            variant={plan.isCurrent ? 'outlined' : 'interactive'}
            className={cn(
              "relative transition-all duration-300",
              plan.isCurrent && "border-primary ring-2 ring-primary/20",
              !plan.isCurrent && "hover:scale-105"
            )}
          >
            {plan.isCurrent && (
              <div className="absolute top-4 right-4">
                <div className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
                  <StarIcon className="w-3 h-3" />
                  Current
                </div>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  plan.isCurrent ? "bg-primary/20" : "bg-muted"
                )}>
                  <PlansIcon className={cn(
                    "w-5 h-5",
                    plan.isCurrent ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
              </div>
              <div className="flex items-baseline gap-1 mt-4">
                <DollarIcon className="w-6 h-6 text-muted-foreground" />
                <span className="text-4xl font-extrabold text-foreground">
                  {plan.price.replace('$', '')}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckIcon className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button
                variant={plan.isCurrent ? 'secondary' : 'primary'}
                fullWidth
                size="lg"
                onClick={() => !plan.isCurrent && handleChoosePlan(plan)}
                disabled={plan.isCurrent}
                leftIcon={plan.isCurrent ? <CheckIcon className="w-4 h-4" /> : undefined}
              >
                {plan.isCurrent ? 'Current Plan' : 'Choose Plan'}
              </Button>
            </CardFooter>
          </Card>
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


