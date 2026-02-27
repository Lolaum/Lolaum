"use client";
import React, { useState, useEffect } from "react";
import mock_todo from "@/mock/todomock";
import { formatDateDisplay, formatDateKey } from "@/modules/Common/dateModules";
import { Check, Trash2 } from "lucide-react";
import { TodoListProps } from "@/types/home/todo";

export default function TodoList({ selectedDate, onTaskClick }: TodoListProps) {
  const dateKey = formatDateKey(selectedDate);
  const initialTodos = mock_todo[dateKey] || [];
  const [todos, setTodos] = useState(initialTodos);
  const [input, setInput] = useState("");

  // 날짜 변경 시 투두 리스트 업데이트
  useEffect(() => {
    setTodos(mock_todo[dateKey] || []);
  }, [dateKey]);

  const handleToggle = (id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: input,
        completed: false,
      },
    ]);
    setInput("");
  };

  const handleDelete = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div>
      {/* 할 일 추가 */}
      <div className="mb-5">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-300 focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20 transition-all"
            placeholder="새로운 할 일을 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleAdd();
              }
            }}
          />
          <button
            className="rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
            style={{ backgroundColor: "#eab32e" }}
            onClick={handleAdd}
          >
            추가
          </button>
        </div>
      </div>

      {/* 진행 중 */}
      <div className="mb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
          진행 중 ({todos.filter((t) => !t.completed).length})
        </p>
        <div className="space-y-2">
          {todos.filter((t) => !t.completed).length === 0 ? (
            <p className="text-sm text-gray-200 text-center py-4">할 일이 없습니다</p>
          ) : (
            todos.filter((t) => !t.completed).map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 border border-transparent hover:border-gray-200 transition-colors"
              >
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 transition-all hover:border-[var(--gold-400)]"
                />
                <span className="flex-1 text-sm text-gray-800 font-medium">{todo.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 완료됨 */}
      {completedTodos.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
            완료됨 ({completedTodos.length})
          </p>
          <div className="space-y-2">
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3"
              >
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ backgroundColor: "#eab32e" }}
                  aria-label="완료 취소"
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                </button>
                <span className="flex-1 text-sm text-gray-400 line-through">{todo.title}</span>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="text-gray-300 hover:text-gray-400 transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
