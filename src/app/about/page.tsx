import type { Metadata } from "next";
import { Lock, Gauge, Wrench } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于",
  description:
    "关于 Toolora：一个免费、无需登录、优先在浏览器本地完成处理的在线工具集合平台，以及它的设计原则与边界。",
};

const principles = [
  {
    icon: Lock,
    title: "数据不上传",
    description:
      "工具尽可能在浏览器本地完成处理，你选择的文件与文本不会离开自己的设备，也不需要注册账号。",
  },
  {
    icon: Gauge,
    title: "轻量快速",
    description:
      "站点为纯静态部署，按需加载，只有进入具体工具时才会加载对应的处理逻辑。",
  },
  {
    icon: Wrench,
    title: "结果真实",
    description:
      "处理结果来自真实的本地运算，不会用模拟数据冒充可以使用的功能。",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">关于 Toolora</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Toolora 是一个免费、简洁的在线工具集合。我们希望把图片处理、开发调试与文档整理这类高频但琐碎的工作，
          变成打开网页就能完成的事情，并且不为此付出注册、上传或等待的代价。
        </p>
      </header>

      <section aria-labelledby="principles-heading" className="mt-8">
        <h2 id="principles-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
          我们坚持的三件事
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {principles.map(({ icon: Icon, title, description }) => (
            <div key={title} className="surface-card p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="privacy-heading" className="mt-12">
        <h2 id="privacy-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
          关于隐私与限制
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Toolora 采用纯静态部署，站点本身没有数据库、没有用户系统，也没有服务端 API。
            因此不存在需要上传你文件的服务端环节：文件处理在浏览器中完成，页面关闭后内容即消失。
          </p>
          <p>
            需要说明的是，纯浏览器方案也有边界：超大文件会受限于浏览器的内存，
            个别依赖跨域请求的能力会受到浏览器的 CORS 限制。
            这些限制会在对应工具的说明中明确写出，不会以「模拟可用」的方式掩盖。
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        还没有找到合适的工具？
        <Link href="/tools" className="ml-1 font-medium text-primary hover:underline">
          浏览全部工具
        </Link>
      </p>
    </div>
  );
}
