"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

export default function AuthDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isActive = true;
    let removeListener: (() => Promise<void>) | undefined;

    async function completeLogin(url: string) {
      try {
      const isUniversalLink = url.startsWith(
          "https://practcoach.com/login-callback",
          );

      const isCustomSchemeLink = url.startsWith(
          "com.practcoach.app://login-callback",
          );

      if (!isUniversalLink && !isCustomSchemeLink) {
        return;
      }

        const parsedUrl = new URL(url);

        const errorDescription =
          parsedUrl.searchParams.get("error_description") ||
          new URLSearchParams(parsedUrl.hash.replace(/^#/, "")).get(
            "error_description",
          );

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // Cas PKCE : Supabase renvoie un code.
        const code = parsedUrl.searchParams.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else {
          // Cas implicite : Supabase renvoie les jetons dans le fragment.
          const hashParameters = new URLSearchParams(
            parsedUrl.hash.replace(/^#/, ""),
          );

          const accessToken = hashParameters.get("access_token");
          const refreshToken = hashParameters.get("refresh_token");

          if (!accessToken || !refreshToken) {
            throw new Error(
              "Le lien de connexion ne contient pas de session Supabase.",
            );
          }

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        }

        if (isActive) {
          router.replace("/access");
        }
      } catch (error) {
        console.error("Erreur de connexion par lien mobile :", error);

        if (isActive) {
          router.replace("/login");
        }
      }
    }

    async function initializeDeepLinks() {
      // Cas où l’application était complètement fermée.
      const launchUrl = await App.getLaunchUrl();

      if (launchUrl?.url) {
        await completeLogin(launchUrl.url);
      }

      // Cas où l’application était déjà ouverte ou en arrière-plan.
      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        void completeLogin(url);
      });

      removeListener = () => listener.remove();
    }

    void initializeDeepLinks();

    return () => {
      isActive = false;
      void removeListener?.();
    };
  }, [router]);

  return null;
}