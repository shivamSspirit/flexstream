declare module 'bn.js' {
  export default class BN {
    constructor(number: number | string | number[] | Buffer, base?: number | 'hex', endian?: 'le' | 'be');

    toNumber(): number;
    toString(base?: number | 'hex', length?: number): string;
    toArray(endian?: 'le' | 'be', length?: number): number[];
    toBuffer(endian?: 'le' | 'be', length?: number): Buffer;

    add(b: BN): BN;
    sub(b: BN): BN;
    mul(b: BN): BN;
    div(b: BN): BN;
    mod(b: BN): BN;

    lt(b: BN): boolean;
    lte(b: BN): boolean;
    gt(b: BN): boolean;
    gte(b: BN): boolean;
    eq(b: BN): boolean;

    isZero(): boolean;
    isNeg(): boolean;

    // Add more methods as needed
  }
}
