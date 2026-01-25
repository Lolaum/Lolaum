"use client";
import HomeContainer from "@/components/Home/HomeContainer";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/home");
}
