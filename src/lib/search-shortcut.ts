/**
 * 全站搜索聚焦的事件约定。
 *
 * 侧边栏搜索入口、快捷键与首页搜索框分处不同组件，通过窗口事件通信，
 * 避免它们互相耦合，也不需要引入全局状态库。
 */

/** 请求聚焦搜索框（当前已在首页时触发）。 */
export const FOCUS_SEARCH_EVENT = "toolora:focus-search";

/** 请求打开搜索（在非首页时需要先跳转）。 */
export const ACTIVATE_SEARCH_EVENT = "toolora:activate-search";

/** 跳转首页后用于接力聚焦的标记。 */
export const PENDING_FOCUS_KEY = "toolora:pending-focus-search";

/** 广播「聚焦搜索框」事件。 */
export function dispatchFocusSearch(): void {
  window.dispatchEvent(new CustomEvent(FOCUS_SEARCH_EVENT));
}

/** 广播「打开搜索」事件。 */
export function dispatchActivateSearch(): void {
  window.dispatchEvent(new CustomEvent(ACTIVATE_SEARCH_EVENT));
}
