import Layout from "@/components/Layout/Layout";
import FinanceContainer from "@/components/Routines/Finance/FinanceContainer";

export default function Page() {
  return (
    <Layout>
      <FinanceContainer mode="new" />
    </Layout>
  );
}
