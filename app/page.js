"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    //初期レンダリング時に　Loginpage　に移動
    router.push("/login");
  }, [router]);
  return null;
}
