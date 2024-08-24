type CPSFn<
  Callbacks extends Array<(...args: unknown[]) => void>
> = (...args: Callbacks) => void

type ChainFns<
  FromCallbacks extends Array<(...args: unknown[]) => void>,
  ToCallbacks extends Array<(...args: unknown[]) => void>,
> = {
  [T in keyof FromCallbacks]?: ((...args: Parameters<FromCallbacks[T]>) => CPSFn<ToCallbacks>) | undefined
}

type CPS<
  Callbacks extends Array<(...args: unknown[]) => void>
> = CPSFn<Callbacks> & {
  chain<
    ToCallbacks extends Array<(...args: unknown[]) => void>
  >(...fns: ChainFns<Callbacks, ToCallbacks>): CPS<ToCallbacks>
}

declare function CPS<
  Callbacks extends Array<(...args: unknown[]) => void>
>(fn: CPSFn<Callbacks>): CPS<Callbacks>

export { CPS, CPSFn }
