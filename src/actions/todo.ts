"use server";

import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/types/supabase";

export async function getTodos(
  date: string,
): Promise<{ data?: Todo[]; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .eq("todo_date", date)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function createTodo(input: {
  title: string;
  todo_date: string;
}): Promise<{ data?: Todo; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: user.id,
      title: input.title,
      todo_date: input.todo_date,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateTodo(
  id: string,
  input: { title?: string; completed?: boolean },
): Promise<{ data?: Todo; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("todos")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteTodo(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
