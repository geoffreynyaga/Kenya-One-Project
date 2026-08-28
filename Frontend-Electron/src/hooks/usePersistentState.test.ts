import { act, renderHook } from "@testing-library/react";

import { usePersistentState } from "./usePersistentState";

beforeEach(() => window.localStorage.clear());

describe("usePersistentState", () => {
  it("fills in fields added since the value was saved", () => {
    window.localStorage.setItem("k", JSON.stringify({ a: 1 }));

    const { result } = renderHook(() =>
      usePersistentState("k", { a: 0, addedLater: 9 })
    );

    expect(result.current[0]).toEqual({ a: 1, addedLater: 9 });
  });

  it("restores a stored array as an array", () => {
    // Spreading an array into an object gives {0: ...}, which has lost every
    // array method — a sheet reading it back crashed on `.includes`.
    window.localStorage.setItem("k", JSON.stringify(["open"]));

    const { result } = renderHook(() => usePersistentState<string[]>("k", []));

    expect(Array.isArray(result.current[0])).toBe(true);
    expect(result.current[0]).toEqual(["open"]);
  });

  it("round-trips a write", () => {
    const { result } = renderHook(() => usePersistentState("k", { a: 0 }));

    act(() => result.current[1]({ a: 5 }));

    expect(JSON.parse(window.localStorage.getItem("k") ?? "{}")).toEqual({
      a: 5,
    });
  });
});
