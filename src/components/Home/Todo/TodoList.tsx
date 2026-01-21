"use client";
import React, { useState, useEffect } from "react";
import mock_todo from "@/mock/todomock";
import {
  formatDateDisplay,
  formatDateKey,
} from "@/components/modules/dateFormat.ts/dateModules";

interface TodoListProps {
  selectedDate: Date;
  onTaskClick: (title: string) => void;
}

export default function TodoList({ selectedDate, onTaskClick }: TodoListProps) {
  const dateKey = formatDateKey(selectedDate);
  const initialTodos = mock_todo[dateKey] || [];
  const [todos, setTodos] = useState(initialTodos);

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

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">할 일 목록</h2>
        </div>
      </div>

      {/* 투두 리스트 */}
      {todos.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          이 날짜에 등록된 할 일이 없습니다
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
              onClick={() => onTaskClick(todo.title)}
            >
              {/* 체크박스 */}
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300"
              />

              {/* 투두 제목 */}
              <span
                className={`flex-1 text-sm ${
                  todo.completed
                    ? "text-gray-400 line-through"
                    : "text-gray-900"
                }`}
              >
                {todo.title}
              </span>

              {/* 삭제 버튼 */}
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
