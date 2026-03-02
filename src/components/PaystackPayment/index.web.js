import React, {useEffect} from 'react';
import {View, ActivityIndicator} from 'react-native';

const PaystackPayment = ({
  amount,
  email,
  billingName,
  onSuccess,
  onCancel,
  showPayment,
}) => {
  useEffect(() => {
    if (showPayment) {
      const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const parsedAmount = Number(amount);
      if (!publicKey || publicKey.trim().length === 0) {
        console.error('[Paystack] Missing EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY');
        onCancel && onCancel({error: 'Missing Paystack public key'});
        return;
      }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        console.error('[Paystack] Invalid or missing email');
        onCancel && onCancel({error: 'Invalid email for payment'});
        return;
      }
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        console.error('[Paystack] Invalid amount:', amount);
        onCancel && onCancel({error: 'Invalid payment amount'});
        return;
      }

      const ensureScript = () =>
        new Promise(resolve => {
          if (window.PaystackPop) {
            resolve();
            return;
          }
          const existing = document.querySelector(
            'script[src="https://js.paystack.co/v1/inline.js"]',
          );
          if (existing) {
            existing.addEventListener('load', () => resolve());
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });

      ensureScript().then(() => {
        try {
          const handler = window.PaystackPop.setup({
            key: publicKey,
            email,
            amount: Math.round(parsedAmount * 100),
            currency: 'NGN',
            ref: '' + Math.floor(Math.random() * 1000000000 + 1),
            onClose: () => {
              console.log('Payment closed');
              onCancel && onCancel();
            },
            callback: response => {
              console.log('Payment success:', response);
              onSuccess && onSuccess(response);
            },
          });
          handler.openIframe();
        } catch (e) {
          console.error('[Paystack] Failed to initialize:', e);
          onCancel &&
            onCancel({error: e?.message || 'Failed to initialize payment'});
        }
      });

      return () => {
        // Cleanup if needed, but the script is globally useful
      };
    }
  }, [showPayment]);

  if (!showPayment) return null;

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

export default PaystackPayment;
