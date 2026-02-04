"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ReadingContainer from "@/components/Routines/Reading/ReadingContainer";
import Layout from "@/components/Layout/Layout";

export default function ReadingPage() {
  const router = useRouter();

  const handleBack = () => {
    // 타이머로 돌아가기 위해 쿼리 파라미터 전달
    router.push("/home?timer=독서리추얼");
  };

  return (
    <Layout>
      <ReadingContainer />
    </Layout>
  );
}
