/*
 * Safe recursive-descent math expression evaluator and unit converter plug-in tool.
 */

import type { NovaToolDefinition } from '../types';

function evaluateSafeMath(expr: string): number {
  const cleaned = expr.replace(/\s+/g, '');
  let pos = 0;

  function parseExpression(): number {
    let left = parseTerm();
    while (pos < cleaned.length && (cleaned[pos] === '+' || cleaned[pos] === '-')) {
      const op = cleaned[pos++];
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePower();
    while (
      pos < cleaned.length &&
      (cleaned[pos] === '*' || cleaned[pos] === '/' || cleaned[pos] === '%')
    ) {
      const op = cleaned[pos++];
      const right = parsePower();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      } else {
        left %= right;
      }
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (pos < cleaned.length && cleaned[pos] === '^') {
      pos++;
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (cleaned[pos] === '+') {
      pos++;
      return parseUnary();
    }
    if (cleaned[pos] === '-') {
      pos++;
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (cleaned[pos] === '(') {
      pos++;
      const val = parseExpression();
      if (cleaned[pos] !== ')') throw new Error('Mismatched parentheses');
      pos++;
      return val;
    }
    const numMatch = /^\d+(\.\d+)?/.exec(cleaned.slice(pos));
    if (numMatch) {
      pos += numMatch[0].length;
      return Number(numMatch[0]);
    }
    throw new Error(`Unexpected token near "${cleaned.slice(pos, pos + 8)}"`);
  }

  const result = parseExpression();
  if (pos !== cleaned.length || !Number.isFinite(result)) {
    throw new Error('Invalid mathematical expression');
  }
  return result;
}

const LENGTH_TO_METERS: Record<string, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  mi: 1609.344,
  ft: 0.3048,
  in: 0.0254,
};

const MASS_TO_KG: Record<string, number> = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
  lb: 0.45359237,
  oz: 0.028349523125,
};

function convertUnitValue(value: number, from: string, to: string): number {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  if (f === t) return value;

  if (f in LENGTH_TO_METERS && t in LENGTH_TO_METERS) {
    return (value * LENGTH_TO_METERS[f]) / LENGTH_TO_METERS[t];
  }
  if (f in MASS_TO_KG && t in MASS_TO_KG) {
    return (value * MASS_TO_KG[f]) / MASS_TO_KG[t];
  }
  if ((f === 'c' || f === 'f' || f === 'k') && (t === 'c' || t === 'f' || t === 'k')) {
    let celsius = value;
    if (f === 'f') celsius = ((value - 32) * 5) / 9;
    if (f === 'k') celsius = value - 273.15;
    if (t === 'c') return celsius;
    if (t === 'f') return (celsius * 9) / 5 + 32;
    return celsius + 273.15;
  }
  throw new Error(`Unsupported unit conversion from "${from}" to "${to}".`);
}

export const calculatorTool: NovaToolDefinition = {
  name: 'evaluate_expression',
  description:
    'Evaluate a mathematical expression safely (supports +, -, *, /, %, ^, parentheses).',
  parameters: {
    type: 'OBJECT',
    properties: {
      expression: { type: 'STRING', description: 'Math expression like "(125 * 8) / 5".' },
    },
    required: ['expression'],
  },
  async execute(args) {
    const expr = String(args.expression ?? '');
    const value = evaluateSafeMath(expr);
    return { expression: expr, result: Number(value.toFixed(6)) };
  },
};

export const unitConverterTool: NovaToolDefinition = {
  name: 'convert_units',
  description:
    'Convert between length (m, km, cm, mm, mi, ft, in), mass (kg, g, mg, lb, oz), and temperature (c, f, k).',
  parameters: {
    type: 'OBJECT',
    properties: {
      value: { type: 'NUMBER', description: 'Numeric value to convert.' },
      fromUnit: { type: 'STRING', description: 'Source unit symbol.' },
      toUnit: { type: 'STRING', description: 'Target unit symbol.' },
    },
    required: ['value', 'fromUnit', 'toUnit'],
  },
  async execute(args) {
    const value = Number(args.value ?? 0);
    const fromUnit = String(args.fromUnit ?? '');
    const toUnit = String(args.toUnit ?? '');
    const converted = convertUnitValue(value, fromUnit, toUnit);
    return {
      input: `${value} ${fromUnit}`,
      output: `${Number(converted.toFixed(4))} ${toUnit}`,
      value: Number(converted.toFixed(4)),
    };
  },
};
