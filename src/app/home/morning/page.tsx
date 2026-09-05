import Layout from "@/components/Layout/Layout";
import MorningContainer from "@/components/Routines/Morning/MorningContainer";
import { DEFAULT_MORNING_MEET_URL } from "@/constants/morning";
import { getActivePeriod } from "@/lib/current-challenge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const { period } = await getActivePeriod();

  return (
    <Layout>
      <MorningContainer
        mode="main"
        morningMeetUrl={period?.morning_meet_url ?? DEFAULT_MORNING_MEET_URL}
      />
    </Layout>
  );
}
