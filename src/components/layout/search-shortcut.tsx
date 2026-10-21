"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  ACTIVATE_SEARCH_EVENT,
  PENDING_FOCUS_KEY,
  dispatchFocusSearch,
} from "@/lib/search-shortcut";

/**
 * 全站搜索快捷键。
 *
 * ⌘K / Ctrl+K 在任意页面都会把用户带到首页的搜索框；
 * 若当前已经在首页则直接聚焦，避免打断阅读。
 */
export function SearchShortcut() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function activate(): void {
      if (window.location.pathname === "/") {
        dispatchFocusSearch();
        return;
      }
      try {
        window.sessionStorage.setItem(PENDING_FOCUS_KEY, "1");
      } catch {
        // 隐私模式下 sessionStorage 可能不可用，此时退化为仅跳转首页。
      }
      router.push("/");
    }

    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        activate();
      }
    }

    function onActivateEvent(): void {
      activate();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(ACTIVATE_SEARCH_EVENT, onActivateEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(ACTIVATE_SEARCH_EVENT, onActivateEvent);
    };
  }, [router]);

  // 跳转回首页后补一次聚焦。
  useEffect(() => {
    if (pathname !== "/") {
      return;
    }
    let pending = false;
    try {
      pending = window.sessionStorage.getItem(PENDING_FOCUS_KEY) === "1";
      if (pending) {
        window.sessionStorage.removeItem(PENDING_FOCUS_KEY);
      }
    } catch {
      pending = false;
    }
    if (pending) {
      dispatchFocusSearch();
    }
  }, [pathname]);

  return null;
}
