import Layout from "@/components/Layout/Layout";
import ExerciseContainer from "@/components/Routines/Exercise/ExerciseContainer";

export default function Page() {
  return (
    <Layout>
      <ExerciseContainer mode="new" />
    </Layout>
  );
}
