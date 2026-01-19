import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            {siteConfig.name}
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {siteConfig.description}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg">시작하기</Button>
            <Button variant="outline" size="lg">
              더 알아보기
            </Button>
          </div>

          <div className="mt-16 p-8 bg-white rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4">프로젝트 구조</h2>
            <div className="text-left max-w-2xl mx-auto">
              <ul className="space-y-2 text-gray-700">
                <li>
                  ✅{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    components/
                  </code>{" "}
                  - 재사용 가능한 컴포넌트
                </li>
                <li>
                  ✅ <code className="bg-gray-100 px-2 py-1 rounded">lib/</code>{" "}
                  - 유틸리티 함수
                </li>
                <li>
                  ✅{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">hooks/</code>{" "}
                  - 커스텀 React Hooks
                </li>
                <li>
                  ✅{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">types/</code>{" "}
                  - TypeScript 타입
                </li>
                <li>
                  ✅{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">config/</code>{" "}
                  - 설정 파일
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Button variant="ghost" size="md">
              Deploy Now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
