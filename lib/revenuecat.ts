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
  // RevenueCat natif ne doit pas être initialisé dans le navigateur Web.
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  if (isConfigured) {
    return;
  }

  const platform = Capacitor.getPlatform();

  let apiKey: string | undefined;

  if (platform === "android") {
  apiKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  } else if (platform === "ios") {
  apiKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY;
  } else {
  return;
  }

if (!apiKey) {
  throw new Error(
    platform === "ios"
      ? "La variable NEXT_PUBLIC_REVENUECAT_IOS_API_KEY est absente."
      : "La variable NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY est absente.",
  );
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

export async function getRevenueCatOfferings(
  appUserId?: string,
): Promise<PurchasesOfferings> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Les offres RevenueCat sont disponibles uniquement dans l’application mobile.",
    );
  }

  const platform = Capacitor.getPlatform();

  if (platform !== "android" && platform !== "ios") {
    throw new Error(
      `La plateforme "${platform}" n’est pas prise en charge par RevenueCat.`,
    );
  }

  await configureRevenueCat(appUserId);

  return Purchases.getOfferings();
}

export async function getIndividualOffering(
  appUserId?: string,
) {
  const offerings =
    await getRevenueCatOfferings(appUserId);

  const individualOffering =
    offerings.all["individual"];

  if (!individualOffering) {
    throw new Error(
      "L’Offering RevenueCat 'individual' est introuvable.",
    );
  }

  return individualOffering;
}

export async function getOrganizationOffering(
  appUserId?: string,
) {
  const offerings =
    await getRevenueCatOfferings(appUserId);

  const organizationOffering =
    offerings.all["organization"];

  if (!organizationOffering) {
    throw new Error(
      "L’Offering RevenueCat 'organization' est introuvable.",
    );
  }

  return organizationOffering;
}

type PurchasePackageParameters = {
  appUserId: string;
  offeringId: "individual" | "organization";
  packageId: string;
};

export async function purchaseRevenueCatPackage({
  appUserId,
  offeringId,
  packageId,
}: PurchasePackageParameters) {
  const offerings =
    await getRevenueCatOfferings(appUserId);

  const offering = offerings.all[offeringId];

  if (!offering) {
    throw new Error(
      `L’Offering RevenueCat '${offeringId}' est introuvable.`,
    );
  }

  const selectedPackage =
    offering.availablePackages.find(
      (item) => item.identifier === packageId,
    );

  if (!selectedPackage) {
    const availablePackageIds =
      offering.availablePackages
        .map((item) => item.identifier)
        .join(", ");

    throw new Error(
      `Le package RevenueCat '${packageId}' est introuvable dans l’Offering '${offeringId}'. Packages disponibles : ${availablePackageIds || "aucun"}.`,
    );
  }

  return Purchases.purchasePackage({
    aPackage: selectedPackage,
  });
}