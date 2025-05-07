"use client";
import { useEffect } from "react";
import { setAuthToken } from "../app/utils/api";

export default function SetAuthTokenEffect() {
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) setAuthToken(token);
  }, []);
  return null;
}
