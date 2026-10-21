/**
 * 严格 JSON 解析器。
 *
 * 浏览器原生 `JSON.parse` 在报错时只给出「位置 N」或一段与引擎相关的文案，
 * 跨浏览器差异较大，也不便于把错误定位到具体的行列。
 * 这里实现一个递归下降解析器，输出结构化的错误信息（消息 / 字符位置 / 行 / 列），
 * 并严格遵循 JSON 规范：不接受注释、尾随逗号、单引号、NaN、Infinity 等扩展写法。
 *
 * 该文件不依赖任何运行时，便于单独做单元测试。
 */

/** 解析失败时的结构化错误信息。 */
export interface JsonErrorInfo {
  /** 面向用户的中文错误描述。 */
  message: string;
  /** 错误在原文中的字符下标（从 0 开始）。 */
  position: number;
  /** 错误所在行（从 1 开始）。 */
  line: number;
  /** 错误所在列（从 1 开始）。 */
  column: number;
}

/** 解析结果。 */
export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonErrorInfo };

/** 支持的缩进方式。 */
export type JsonIndent = 2 | 4 | "\t";

/** 允许的最大嵌套层级，避免超深输入导致调用栈溢出。 */
const MAX_DEPTH = 200;

class ParseFailure extends Error {
  /** 错误在原文中的字符下标。 */
  position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = "ParseFailure";
    this.position = position;
  }
}

function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= "0" && char <= "9";
}

/** 把字符下标换算成行列（行列均从 1 开始）。 */
export function locatePosition(text: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const limit = Math.min(position, text.length);
  for (let i = 0; i < limit; i += 1) {
    if (text[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

/**
 * 计算数字字面量表示的精确整数值。
 *
 * 若该字面量表示的不是整数（例如带小数且指数为负），返回 null。
 * 借助 BigInt 做精确比较，可以识别出「超出可精确表示范围的大整数被静默取整」这类数据改变。
 */
export function exactIntegerValue(literal: string): bigint | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?([eE]([+-]?\d+))?$/.exec(literal);
  if (!match) {
    return null;
  }
  const sign = match[1] === "-" ? -1n : 1n;
  const intPart = match[2] ?? "0";
  const fracPart = match[3] ?? "";
  const exponent = match[5] ? Number(match[5]) : 0;

  let value = BigInt(`${intPart}${fracPart}`);
  const scale = exponent - fracPart.length;
  if (scale > 400 || scale < -400) {
    // 尺度已经超出可表示范围，交由溢出 / 下溢判断处理。
    return null;
  }
  if (scale > 0) {
    value *= 10n ** BigInt(scale);
  } else if (scale < 0) {
    const divisor = 10n ** BigInt(-scale);
    if (value % divisor !== 0n) {
      // 结果不是整数。
      return null;
    }
    value /= divisor;
  }
  return sign * value;
}

/**
 * 严格解析 JSON 文本。
 *
 * 成功时返回解析出的值；失败时返回带行列信息的错误，不抛异常。
 */
export function parseJsonStrict(text: string): JsonParseResult {
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: { message: "内容为空，请输入 JSON 文本", position: 0, line: 1, column: 1 },
    };
  }

  let index = 0;
  let depth = 0;

  const fail = (message: string, position = index): never => {
    throw new ParseFailure(message, position);
  };

  const skipWhitespace = (): void => {
    while (index < text.length) {
      const char = text.charAt(index);
      if (char === " " || char === "\t" || char === "\n" || char === "\r") {
        index += 1;
      } else {
        break;
      }
    }
  };

  const parseString = (): string => {
    const start = index;
    index += 1; // 消费起始引号
    let result = "";
    for (;;) {
      if (index >= text.length) {
        fail("字符串没有闭合，缺少结束的引号", start);
      }
      const char = text.charAt(index);
      if (char === '"') {
        index += 1;
        return result;
      }
      if (char === "\\") {
        const escapeStart = index;
        index += 1;
        if (index >= text.length) {
          fail("转义字符不完整", escapeStart);
        }
        const escape = text[index];
        index += 1;
        switch (escape) {
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          case "/":
            result += "/";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          case "u": {
            const hex = text.slice(index, index + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              fail(`无效的 Unicode 转义 \\u${hex}`, index);
            }
            result += String.fromCharCode(Number.parseInt(hex, 16));
            index += 4;
            break;
          }
          default:
            fail(`无效的转义字符 \\${escape}`, escapeStart);
        }
        continue;
      }
      if (char.charCodeAt(0) < 0x20) {
        fail("字符串中包含未转义的控制字符", index);
      }
      result += char;
      index += 1;
    }
  };

  const parseNumber = (): number => {
    const start = index;
    if (text[index] === "-") {
      index += 1;
    }
    if (text[index] === "0") {
      index += 1;
    } else if (isDigit(text[index])) {
      while (isDigit(text[index])) {
        index += 1;
      }
    } else {
      fail("数字格式不正确", start);
    }
    if (text[index] === ".") {
      index += 1;
      if (!isDigit(text[index])) {
        fail("数字格式不正确", start);
      }
      while (isDigit(text[index])) {
        index += 1;
      }
    }
    if (text[index] === "e" || text[index] === "E") {
      index += 1;
      if (text[index] === "+" || text[index] === "-") {
        index += 1;
      }
      if (!isDigit(text[index])) {
        fail("数字格式不正确", start);
      }
      while (isDigit(text[index])) {
        index += 1;
      }
    }

    const literal = text.slice(start, index);
    const value = Number(literal);

    // 数值必须能被无损表示，否则宁可报错，也不能在格式化后悄悄变成另一个值。
    if (!Number.isFinite(value)) {
      fail(`数值 ${literal} 超出可表示范围（会变成 ${value}），无法无损处理`, start);
    }
    const exact = exactIntegerValue(literal);
    if (exact !== null && BigInt(value) !== exact) {
      fail(
        `整数 ${literal} 超出可精确表示的范围（会变成 ${BigInt(value).toString()}），无法无损处理`,
        start,
      );
    }
    if (value === 0 && /[1-9]/.test(literal.split(/[eE]/)[0] ?? "")) {
      fail(`数值 ${literal} 太小，在 JavaScript 中会变成 0，无法无损处理`, start);
    }

    return value;
  };

  const parseObject = (): Record<string, unknown> => {
    const start = index;
    index += 1; // 消费 {
    const result: Record<string, unknown> = {};
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return result;
    }
    for (;;) {
      skipWhitespace();
      if (index >= text.length) {
        fail("对象没有闭合，缺少右花括号 }", start);
      }
      if (text[index] === "}") {
        fail("对象中出现了多余的逗号", index);
      }
      if (text[index] !== '"') {
        fail("对象的键必须是双引号包裹的字符串", index);
      }
      const key = parseString();
      skipWhitespace();
      if (text[index] !== ":") {
        fail("键之后缺少冒号 :", index);
      }
      index += 1;
      skipWhitespace();
      // 用 defineProperty 写入，避免 "__proto__" 触发原型 setter 导致键被吞掉或改写原型。
      Object.defineProperty(result, key, {
        value: parseValue(),
        enumerable: true,
        writable: true,
        configurable: true,
      });
      skipWhitespace();
      if (index >= text.length) {
        fail("对象没有闭合，缺少右花括号 }", start);
      }
      if (text[index] === ",") {
        index += 1;
        continue;
      }
      if (text[index] === "}") {
        index += 1;
        return result;
      }
      fail("对象中缺少逗号或右花括号 }", index);
    }
  };

  const parseArray = (): unknown[] => {
    const start = index;
    index += 1; // 消费 [
    const result: unknown[] = [];
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return result;
    }
    for (;;) {
      skipWhitespace();
      if (index >= text.length) {
        fail("数组没有闭合，缺少右方括号 ]", start);
      }
      if (text[index] === "]") {
        fail("数组中出现了多余的逗号", index);
      }
      result.push(parseValue());
      skipWhitespace();
      if (index >= text.length) {
        fail("数组没有闭合，缺少右方括号 ]", start);
      }
      if (text[index] === ",") {
        index += 1;
        continue;
      }
      if (text[index] === "]") {
        index += 1;
        return result;
      }
      fail("数组中缺少逗号或右方括号 ]", index);
    }
  };

  function parseValue(): unknown {
    if (index >= text.length) {
      fail("内容不完整，缺少 JSON 值");
    }
    depth += 1;
    if (depth > MAX_DEPTH) {
      fail(`嵌套层级过深（最多支持 ${MAX_DEPTH} 层）`);
    }
    try {
      const char = text.charAt(index);
      if (char === "{") {
        return parseObject();
      }
      if (char === "[") {
        return parseArray();
      }
      if (char === '"') {
        return parseString();
      }
      if (char === "-" || isDigit(char)) {
        return parseNumber();
      }
      if (text.startsWith("true", index)) {
        index += 4;
        return true;
      }
      if (text.startsWith("false", index)) {
        index += 5;
        return false;
      }
      if (text.startsWith("null", index)) {
        index += 4;
        return null;
      }
      fail(`无法识别的内容 “${char}”`);
    } finally {
      depth -= 1;
    }
  }

  try {
    // 顶层值之前允许出现 JSON 规范中的空白字符（空格 / 制表符 / 换行 / 回车）。
    skipWhitespace();
    const value = parseValue();
    skipWhitespace();
    if (index < text.length) {
      fail("内容末尾存在多余字符");
    }
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ParseFailure) {
      const { line, column } = locatePosition(text, error.position);
      return {
        ok: false,
        error: { message: error.message, position: error.position, line, column },
      };
    }
    throw error;
  }
}

/** 按指定缩进美化已解析的值。 */
export function formatJsonValue(value: unknown, indent: JsonIndent): string {
  return JSON.stringify(value, null, indent) ?? "";
}

/** 压缩为单行 JSON。 */
export function minifyJsonValue(value: unknown): string {
  return JSON.stringify(value) ?? "";
}

/** 统计文本行数，用于编辑器的行号栏。 */
export function countLines(text: string): number {
  if (text.length === 0) {
    return 1;
  }
  let lines = 1;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\n") {
      lines += 1;
    }
  }
  return lines;
}
