import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json, ReadingRecordData } from "@/types/supabase";

// GET /api/ritual-records/english-book?challengeId=xxx&date=2026-04-03
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const challengeId = searchParams.get("challengeId");

  if (!challengeId) {
    return NextResponse.json(
      { error: "challengeId는 필수입니다." },
      { status: 400 },
    );
  }

  let query = supabase
    .from("ritual_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", "english_book");

  const date = searchParams.get("date");
  if (date) {
    query = query.eq("record_date", date);
  }

  const { data, error } = await query.order("created_at", {
    ascending: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

// POST /api/ritual-records/english-book
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { challengeId, recordDate, recordData } = body as {
    challengeId: string;
    recordDate: string;
    recordData: ReadingRecordData;
  };

  if (!challengeId || !recordDate || !recordData) {
    return NextResponse.json(
      { error: "challengeId, recordDate, recordData는 필수입니다." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("ritual_records")
    .insert({
      user_id: user.id,
      challenge_id: challengeId,
      routine_type: "english_book",
      record_date: recordDate,
      record_data: recordData as unknown as Json,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
