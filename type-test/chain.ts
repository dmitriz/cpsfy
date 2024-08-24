import { CPS, type CPSFn } from "../index"

const cpsFn: CPSFn<[
  (a: number, b: number) => void,
  (a: number, b: string) => void,
]> = (cb1, cb2) => { cb1(2,3); cb2(7, "bar") }

const f1 = (x: number, y: number): CPSFn<[
  (x: number, y?: string) => void,
  (x: number) => void,
]> => (cb1, cb2) => { cb1(x+y); cb2(x-y) }

const f2 = (x: number, y: string): CPSFn<[
  (x: number, y?: string) => void,
]> => (cb1) => { cb1(x, y) }

const chainOneWay = CPS(cpsFn).chain(f1, f2)

const chainSecondWay = CPS(cpsFn).chain<[
  (x: number, y?: string) => void,
  (x: number) => void,
]>(
  (x, y) => (cb1, cb2) => { cb1(x+y); cb2(x-y) },
  (x, y) => (cb1) => { cb1(x, y) }
)

const chainThirdWay = CPS(cpsFn).chain(
  (x: number, y: number) => (
    cb1: (x: number, y?: string) => void,
    cb2: (x: number) => void
  ) => { cb1(x+y); cb2(x-y) },
  (x: number, y: string) => (
    cb1: (x: number, y?: string) => void,
  ) => { cb1(x, y) }
)
