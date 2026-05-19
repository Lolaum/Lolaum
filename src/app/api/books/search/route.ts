import { NextRequest, NextResponse } from "next/server";

export interface BookSearchResult {
  title: string;
  author: string;
  thumbnail: string;
}

interface KakaoBookDocument {
  title: string;
  authors: string[];
  thumbnail: string;
}

interface KakaoBookResponse {
  documents: KakaoBookDocument[];
  meta: { total_count: number; pageable_count: number; is_end: boolean };
}

const KAKAO_BOOK_ENDPOINT = "https://dapi.kakao.com/v3/search/book";

export async function GET(request: NextRequest) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KAKAO_REST_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ documents: [] satisfies BookSearchResult[] });
  }

  const size = Math.min(Number(searchParams.get("size") ?? "10"), 50);

  const url = new URL(KAKAO_BOOK_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("target", "title");
  url.searchParams.set("size", String(size));
  url.searchParams.set("sort", "accuracy");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `카카오 책 검색 실패 (${res.status})` },
      { status: res.status },
    );
  }

  const data: KakaoBookResponse = await res.json();

  const documents: BookSearchResult[] = data.documents.map((d) => ({
    title: d.title,
    author: d.authors.join(", "),
    thumbnail: d.thumbnail,
  }));

  return NextResponse.json({ documents });
}
