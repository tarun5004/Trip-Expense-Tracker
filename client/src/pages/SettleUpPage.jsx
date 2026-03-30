/**
 * @component SettleUpPage
 * @description Renders the PaymentFlow organism, extracting URL parameters to auto-fill payee dependencies if navigated from a Balance list.
 * @usedBy Route: /groups/:groupId/settle?payeeId=xxx
 */

import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import PaymentFlow from '../components/organisms/PaymentFlow';
import ROUTES from '../constants/routes';

export const SettleUpPage = () => {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const payeeId = searchParams.get('payeeId');

  // Mock global viewer state
  const viewerUser = { userId: 'u1', name: 'John Doe' };
  
  // Mock subset of simplified debts representing users we owe money to
  const availablePayees = [
    { userId: 'u2', name: 'Bob Builder', owedToThemCents: 250000 },
    { userId: 'u3', name: 'Charlie', owedToThemCents: 150000 },
  ];

  const handlePaymentSubmit = async (payload) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Recorded Payment:", payload);
        resolve(); // Ack successful
        navigate(ROUTES.GROUP_DETAIL(groupId)); // Navigate back
      }, 1000);
    });
  };

  const handleCancel = () => {
    navigate(ROUTES.GROUP_DETAIL(groupId));
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pt-8 pb-12 h-full justify-center">
      <PaymentFlow 
        viewerUser={viewerUser}
        availablePayees={availablePayees}
        defaultPayeeId={payeeId}
        onSubmit={handlePaymentSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default SettleUpPage;
