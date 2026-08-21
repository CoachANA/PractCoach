"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function ConditionalNavBar() {
  const pathname = usePathname();

  const hideNavBar =
    pathname === "/" ||
    pathname === "/login";

  if (hideNavBar) {
    return null;
  }

  return <NavBar />;
}