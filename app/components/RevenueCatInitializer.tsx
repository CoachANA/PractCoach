"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import { configureRevenueCat } from "@/lib/revenuecat";

export default function RevenueCatInitializer() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isMounted = true;

    async function initialize() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (user && isMounted) {
          await configureRevenueCat(user.id);
          console.log("RevenueCat initialisé pour :", user.id);
        }
      } catch (error) {
        console.error("Erreur d’initialisation RevenueCat :", error);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void configureRevenueCat(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}