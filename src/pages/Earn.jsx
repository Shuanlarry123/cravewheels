import React from "react";
import { useParams } from "react-router-dom";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";
import EarnLanding, { EARN_CONFIG } from "@/components/earn/EarnLanding";

function EarnInner() {
  const { type } = useParams();
  const config = EARN_CONFIG[type];

  if (!config) {
    return (
      <CustomerLayout>
        <div className="p-8 text-center text-sm text-muted-foreground">Unknown program.</div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <EarnLanding config={config} />
    </CustomerLayout>
  );
}

export default function Earn() {
  return (
    <CartProvider>
      <EarnInner />
    </CartProvider>
  );
}