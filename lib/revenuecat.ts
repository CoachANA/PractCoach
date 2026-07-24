import { Capacitor } from "@capacitor/core";
import {
  LOG_LEVEL,
  Purchases,
  type PurchasesOfferings,
} from "@revenuecat/purchases-capacitor";

let isConfigured = false;

export async function configureRevenueCat(
  appUserId?: string,
): Promise<void> {
  // RevenueCat natif ne doit pas être initialisé dans le navigateur web.
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  if (isConfigured) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  if (!apiKey) {
    throw new Error(
      "La variable NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY est absente.",
    );
  }

  if (Capacitor.getPlatform() !== "android") {
    return;
  }

  await Purchases.setLogLevel({
    level: LOG_LEVEL.DEBUG,
  });

  await Purchases.configure({
    apiKey,
    appUserID: appUserId,
  });

  isConfigured = true;
}

export async function getRevenueCatOfferings(): Promise<PurchasesOfferings> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Les offres RevenueCat sont disponibles uniquement dans l’application mobile.",
    );
  }

  return Purchases.getOfferings();
}

export async function getIndividualOffering(appUserId?: string) {
  await configureRevenueCat(appUserId);

  const offerings = await Purchases.getOfferings();
  const individualOffering = offerings.all["individual"];

  if (!individualOffering) {
    throw new Error(
      "L’Offering RevenueCat 'individual' est introuvable.",
    );
  }

  return individualOffering;
}