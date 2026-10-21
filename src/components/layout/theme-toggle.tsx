"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

/** 订阅一个只在客户端为真的快照，用于判断组件是否已完成 hydration。 */
const emptySubscribe = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** 主题切换按钮：在浅色与深色模式之间切换。 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // 服务端渲染时无法得知用户主题，先渲染占位图标，挂载后再切换，避免 hydration 不一致。
  const hydrated = useHydrated();

  const isDark = hydrated && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
