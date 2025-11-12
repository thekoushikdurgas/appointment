'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_PLANS } from '../../../../utils/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { CreditCardIcon, CheckIcon, DollarIcon, PlansIcon, ArrowRightIcon } from '../../../../components/icons/IconComponents';

const BillingSettings: React.FC = () => {
    const currentPlan = MOCK_PLANS.find(p => p.isCurrent);
  
    return (
      <div className="flex flex-col gap-6 w-full max-w-full">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
                <CreditCardIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-foreground">Billing</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your subscription and billing information</p>
            </div>
        </div>
        
        {currentPlan ? (
          <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Current Plan</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <PlansIcon className="w-6 h-6 text-primary" />
                            <CardTitle className="text-3xl">{currentPlan.name}</CardTitle>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <DollarIcon className="w-5 h-5 text-muted-foreground" />
                            <p className="text-2xl font-bold text-foreground">{currentPlan.price.replace('$', '')}</p>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </div>
                    <Button
                        asChild
                        variant="primary"
                        rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                    >
                        <Link href="/plans">
                            Manage Subscription
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Plan Features</p>
                    <ul className="space-y-3">
                        {currentPlan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <CheckIcon className="w-5 h-5 text-success" />
                                </div>
                                <span className="text-muted-foreground">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                    <CreditCardIcon className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">You are not subscribed to any plan</p>
                    <p className="text-sm text-muted-foreground/80">Choose a plan to get started</p>
                    <Button
                        asChild
                        variant="primary"
                        className="mt-2"
                        rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                    >
                        <Link href="/plans">
                            View Plans
                        </Link>
                    </Button>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
};

export default BillingSettings;

