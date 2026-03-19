import React, { Suspense } from "react";
import FeedContainer from "@/components/Feed/FeedContainer";
import Layout from "@/components/Layout/Layout";

export default function VerifyPage() {
  return (
    <Layout>
      <Suspense>
        <FeedContainer />
      </Suspense>
    </Layout>
  );
}
