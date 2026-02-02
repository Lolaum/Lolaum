"use client";
import React, { useState, useEffect } from "react";
import mock_todo from "@/mock/todomock";
import { formatDateDisplay, formatDateKey } from "@/modules/Common/dateModules";
import { Check, Trash2 } from "lucide-react";

interface TodoListProps {
  selectedDate: Date;
  onTaskClick: (title: string, color: string) => void;
}

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
    <div className="bg-white rounded-xl p-6">
      {/* divider */}
      <div className="w-full h-px bg-gray-200 mb-6" />

      {/* 할 일 추가 */}
      <div className="mb-6">
        <div className="mb-1 text-sm font-semibold text-gray-500">
          할 일 추가
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-base focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
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
            className="rounded-lg bg-yellow-400 px-6 py-3 text-base font-bold text-white shadow hover:bg-yellow-500 transition-colors"
            onClick={handleAdd}
          >
            + 추가
          </button>
        </div>
      </div>

      {/* divider */}
      <div className="w-full h-px bg-gray-300 mb-6" />

      {/* 미완료 할 일 - 진행 중 */}
      <div className="mb-2 text-sm font-bold text-gray-400">
        진행 중{" "}
        <span className="ml-1 font-normal">
          ({todos.filter((t) => !t.completed).length})
        </span>
      </div>
      <div className="mb-8">
        <div className="space-y-3">
          {todos.filter((t) => !t.completed).length === 0 ? (
            <div className="text-sm text-gray-200">할 일이 없습니다</div>
          ) : (
            todos
              .filter((t) => !t.completed)
              .map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-4 rounded-2xl bg-[#FCFCFC] px-8 py-5"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-yellow-200 bg-white"
                  />
                  <span className="flex-1 text-base text-gray-900 font-semibold">
                    {todo.title}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* divider */}
      <div className="w-full h-px bg-gray-300 mb-6" />

      {/* 완료된 할 일 */}
      <div className="mb-2 text-sm font-bold text-gray-300">
        완료됨{" "}
        <span className="ml-1 font-normal">({completedTodos.length})</span>
      </div>
      <div className="space-y-3">
        {completedTodos.length === 0 ? (
          <div className="text-sm text-gray-200">완료된 할 일이 없습니다</div>
        ) : (
          completedTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-4 rounded-2xl bg-[#FCFCFC] px-4 py-3"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded bg-yellow-400">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="flex-1 text-base text-gray-400 font-semibold line-through">
                {todo.title}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="삭제"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
