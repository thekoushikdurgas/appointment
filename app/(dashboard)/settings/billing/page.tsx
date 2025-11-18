'use client';

import React, { useState } from 'react';
import { MOCK_PLANS } from '@utils/constants';
import { Plan } from '@/types/index';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Tooltip } from '@components/ui/Tooltip';
import { CollapsibleSection } from '@components/ui/CollapsibleSection';
import { BottomSheet } from '@components/ui/BottomSheet';
import { FullScreenOverlay } from '@components/ui/FullScreenOverlay';
import { CreditCardIcon, CheckIcon, DollarIcon, PlansIcon, StarIcon, XMarkIcon, SparklesIcon } from '@components/icons';

const ConfirmationModal: React.FC<{
  plan: Plan | null;
  onConfirm: () => void;
  onCancel: () => void;
  isMobile: boolean;
}> = ({ plan, onConfirm, onCancel, isMobile }) => {
  if (!plan) return null;

  const modalContent = (
    <div className="settings-billing-confirm-modal">
      <div className="settings-billing-confirm-modal-header">
        <div className="settings-billing-confirm-modal-icon-wrapper">
          <PlansIcon className="settings-billing-confirm-modal-icon" />
        </div>
        <h3 className="settings-billing-confirm-modal-title">Confirm Plan Change</h3>
        <p className="settings-billing-confirm-modal-description">
          Are you sure you want to switch to the <span className="settings-billing-confirm-modal-plan-name">{plan.name}</span> plan?
        </p>
      </div>

      <div className="settings-billing-confirm-modal-details">
        <div className="settings-billing-confirm-modal-detail-item">
          <span className="settings-billing-confirm-modal-detail-label">New Plan:</span>
          <span className="settings-billing-confirm-modal-detail-value">{plan.name}</span>
        </div>
        <div className="settings-billing-confirm-modal-detail-item">
          <span className="settings-billing-confirm-modal-detail-label">Price:</span>
          <div className="settings-billing-confirm-modal-price">
            <DollarIcon className="settings-billing-confirm-modal-price-icon" />
            <span className="settings-billing-confirm-modal-price-amount">{plan.price.replace('$', '')}</span>
            <span className="settings-billing-confirm-modal-price-period">/month</span>
          </div>
        </div>
      </div>

      <div className="settings-billing-confirm-modal-actions">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="settings-billing-confirm-modal-cancel-btn"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          className="settings-billing-confirm-modal-confirm-btn"
        >
          Confirm Change
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={!!plan}
        onClose={onCancel}
        title="Confirm Plan Change"
      >
        {modalContent}
      </BottomSheet>
    );
  }

  return (
    <FullScreenOverlay
      isOpen={!!plan}
      onClose={onCancel}
      title="Confirm Plan Change"
    >
      {modalContent}
    </FullScreenOverlay>
  );
};

const BillingSettings: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentPlan = plans.find(p => p.isCurrent);

  const handleChoosePlan = (planToChoose: Plan) => {
    if (planToChoose.isCurrent) return;
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
    <div className="settings-billing-page">
      
      {/* Current Plan Summary Card */}
      {currentPlan && (
        <Card variant="glass-frosted" className="settings-billing-current-plan">
          <CardHeader>
            <div className="settings-billing-current-plan-header">
              <div className="settings-billing-current-plan-content">
                <div className="settings-billing-current-plan-title-section">
                  <div className="settings-billing-current-plan-icon-wrapper">
                    <CreditCardIcon className="settings-billing-current-plan-icon" />
                  </div>
                  <div>
                    <p className="settings-billing-current-plan-label">Current Subscription</p>
                    <div className="settings-billing-current-plan-name-section">
                      <CardTitle className="settings-billing-current-plan-name">{currentPlan.name}</CardTitle>
                      <div className="settings-billing-current-plan-badge">
                        <StarIcon className="settings-billing-current-plan-badge-icon" />
                        Active
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="settings-billing-current-plan-price">
                  <DollarIcon className="settings-billing-current-plan-price-icon" />
                  <span className="settings-billing-current-plan-price-amount">{currentPlan.price.replace('$', '')}</span>
                  <span className="settings-billing-current-plan-price-period">/month</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="settings-billing-current-plan-features">
              <div className="settings-billing-current-plan-features-header">
                <SparklesIcon className="settings-billing-current-plan-features-icon" />
                <p className="settings-billing-current-plan-features-title">Plan Features</p>
              </div>
              <ul className="settings-billing-current-plan-features-list">
                {currentPlan.features.map((feature, index) => (
                  <li key={`current-plan-feature-${index}-${feature}`} className="settings-billing-current-plan-feature-item">
                    <div className="settings-billing-current-plan-feature-icon-wrapper">
                      <CheckIcon className="settings-billing-current-plan-feature-icon" />
                    </div>
                    <span className="settings-billing-current-plan-feature-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans Section - Desktop */}
      <div className="settings-billing-plans-desktop">
        <div className="settings-billing-plans-header">
          <div className="settings-billing-plans-header-icon-wrapper">
            <PlansIcon className="settings-billing-plans-header-icon" />
          </div>
          <div>
            <h3 className="settings-billing-plans-title">Available Plans</h3>
            <p className="settings-billing-plans-description">Choose the plan that fits your needs</p>
          </div>
        </div>

        <div className="settings-billing-plans-grid">
          {plans.map((plan, planIdx) => (
            <Card
              key={`plan-${plan.name || planIdx}`}
              variant="glass-frosted"
              className={`settings-billing-plan-card ${plan.isCurrent ? 'settings-billing-plan-card--current' : 'settings-billing-plan-card--available'}`}
              onClick={() => !plan.isCurrent && handleChoosePlan(plan)}
            >
              {plan.isCurrent && (
                <div className="settings-billing-plan-card-badge">
                  <div className="settings-billing-plan-card-badge-content">
                    <StarIcon className="settings-billing-plan-card-badge-icon" />
                    Current
                  </div>
                </div>
              )}
              
              <CardHeader>
                <div className="settings-billing-plan-card-header">
                  <div className={`settings-billing-plan-card-icon-wrapper ${plan.isCurrent ? 'settings-billing-plan-card-icon-wrapper--current' : ''}`}>
                    <PlansIcon className={`settings-billing-plan-card-icon ${plan.isCurrent ? 'settings-billing-plan-card-icon--current' : ''}`} />
                  </div>
                  <CardTitle className="settings-billing-plan-card-name">{plan.name}</CardTitle>
                </div>
                <div className="settings-billing-plan-card-price">
                  <DollarIcon className="settings-billing-plan-card-price-icon" />
                  <span className="settings-billing-plan-card-price-amount">
                    {plan.price.replace('$', '')}
                  </span>
                  <span className="settings-billing-plan-card-price-period">/month</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="settings-billing-plan-card-features">
                  {plan.features.map((feature, featureIndex) => (
                    <Tooltip 
                      key={`plan-${plan.name}-feature-${featureIndex}-${feature}`}
                      content={`Included in ${plan.name} plan`}
                      side="left"
                    >
                      <li className="settings-billing-plan-card-feature-item">
                        <div className="settings-billing-plan-card-feature-icon-wrapper">
                          <CheckIcon className="settings-billing-plan-card-feature-icon" />
                        </div>
                        <span className="settings-billing-plan-card-feature-text">{feature}</span>
                      </li>
                    </Tooltip>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  variant={plan.isCurrent ? 'secondary' : 'primary'}
                  fullWidth
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    !plan.isCurrent && handleChoosePlan(plan);
                  }}
                  disabled={plan.isCurrent}
                  leftIcon={plan.isCurrent ? <CheckIcon className="settings-billing-plan-card-btn-icon" /> : undefined}
                  className="settings-billing-plan-card-btn"
                >
                  {plan.isCurrent ? 'Current Plan' : 'Choose Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Plans Section - Mobile (Collapsible) */}
      <div className="settings-billing-plans-mobile">
        <CollapsibleSection 
          title="Available Plans" 
          defaultOpen={false}
          icon={<PlansIcon className="settings-billing-plans-header-icon" />}
        >
          <div className="settings-billing-plans-mobile-content">
            {plans.map((plan, planIdx) => (
              <Card
                key={`plan-${plan.name || planIdx}`}
                variant="glass-frosted"
                className={`settings-billing-plan-card settings-billing-plan-card--mobile ${plan.isCurrent ? 'settings-billing-plan-card--current' : 'settings-billing-plan-card--available'}`}
              >
                {plan.isCurrent && (
                  <div className="settings-billing-plan-card-badge settings-billing-plan-card-badge--mobile">
                    <div className="settings-billing-plan-card-badge-content">
                      <StarIcon className="settings-billing-plan-card-badge-icon" />
                      Current
                    </div>
                  </div>
                )}
                
                <CardHeader>
                  <div className="settings-billing-plan-card-header settings-billing-plan-card-header--mobile">
                    <div className="settings-billing-plan-card-icon-wrapper">
                      <PlansIcon className={`settings-billing-plan-card-icon settings-billing-plan-card-icon--mobile ${plan.isCurrent ? 'settings-billing-plan-card-icon--current' : ''}`} />
                    </div>
                    <CardTitle className="settings-billing-plan-card-name settings-billing-plan-card-name--mobile">{plan.name}</CardTitle>
                  </div>
                  <div className="settings-billing-plan-card-price settings-billing-plan-card-price--mobile">
                    <DollarIcon className="settings-billing-plan-card-price-icon settings-billing-plan-card-price-icon--mobile" />
                    <span className="settings-billing-plan-card-price-amount settings-billing-plan-card-price-amount--mobile">
                      {plan.price.replace('$', '')}
                    </span>
                    <span className="settings-billing-plan-card-price-period settings-billing-plan-card-price-period--mobile">/month</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="settings-billing-plan-card-features settings-billing-plan-card-features--mobile">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={`plan-${plan.name}-feature-${featureIndex}-${feature}`} className="settings-billing-plan-card-feature-item settings-billing-plan-card-feature-item--mobile">
                        <div className="settings-billing-plan-card-feature-icon-wrapper settings-billing-plan-card-feature-icon-wrapper--mobile">
                          <CheckIcon className="settings-billing-plan-card-feature-icon settings-billing-plan-card-feature-icon--mobile" />
                        </div>
                        <span className="settings-billing-plan-card-feature-text">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    variant={plan.isCurrent ? 'secondary' : 'primary'}
                    fullWidth
                    onClick={() => !plan.isCurrent && handleChoosePlan(plan)}
                    disabled={plan.isCurrent}
                    leftIcon={plan.isCurrent ? <CheckIcon className="settings-billing-plan-card-btn-icon" /> : undefined}
                    className="settings-billing-plan-card-btn settings-billing-plan-card-btn--mobile"
                  >
                    {plan.isCurrent ? 'Current Plan' : 'Choose Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        plan={selectedPlan}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
        isMobile={isMobile}
      />
    </div>
  );
};

export default BillingSettings;
