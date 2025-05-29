// one liner functions go here
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isClientSide(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isServerSide(): boolean {
  return !isClientSide();
}
