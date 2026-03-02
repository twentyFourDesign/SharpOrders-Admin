import React from 'react';
import { Paystack } from 'react-native-paystack-webview';
import { View } from 'react-native';

const PaystackPayment = ({ 
  amount, 
  email, 
  billingName, 
  onSuccess, 
  onCancel, 
  showPayment 
}) => {
  if (!showPayment) return null;

  return (
    <View style={{ flex: 1 }}>
      <Paystack
        paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY}
        amount={amount * 100} // Convert Naira to Kobo
        billingEmail={email}
        billingName={billingName}
        currency="NGN"
        activityIndicatorColor="#007AFF"
        onCancel={(e) => {
          console.log('Payment canceled:', e);
          onCancel && onCancel(e);
        }}
        onSuccess={(res) => {
          console.log('Payment success:', res);
          onSuccess && onSuccess(res);
        }}
        autoStart={true}
      />
    </View>
  );
};

export default PaystackPayment;
