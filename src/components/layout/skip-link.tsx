/** 跳转到主内容的快捷链接，键盘用户按 Tab 时可见。 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
    >
      跳到主要内容
    </a>
  );
}
