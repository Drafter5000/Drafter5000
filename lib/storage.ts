"use client"

export interface UserData {
  articles: string[]
  subjects: string[]
  email: string
  firstName: string
  lastName: string
  frequency: string[]
  language: string
  isLoggedIn: boolean
}

const defaultUserData: UserData = {
  articles: ["", "", ""],
  subjects: [],
  email: "",
  firstName: "",
  lastName: "",
  frequency: [],
  language: "en",
  isLoggedIn: false,
}

export function getUserData(): UserData {
  if (typeof window === "undefined") return defaultUserData
  const data = localStorage.getItem("writeai_user")
  return data ? JSON.parse(data) : defaultUserData
}

export function saveUserData(data: Partial<UserData>): void {
  if (typeof window === "undefined") return
  const current = getUserData()
  const updated = { ...current, ...data }
  localStorage.setItem("writeai_user", JSON.stringify(updated))
}

export function clearUserData(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("writeai_user")
}
