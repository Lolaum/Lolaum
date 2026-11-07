import Layout from "@/components/Layout/Layout";
import MorningContainer from "@/components/Routines/Morning/MorningContainer";
import { getMyRoutines } from "@/api/routine";

export default async function Page() {
  const { data: routines, error } = await getMyRoutines();
  const morning = routines?.find(
    (routine) => routine.routine_type === "morning",
  );
  return (
    <Layout>
      <MorningContainer
        mode="new"
        morningStartTime={morning?.routine_start_time ?? null}
        scheduleError={error}
      />
    </Layout>
  );
}
