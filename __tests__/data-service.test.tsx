import { renderHook, act, waitFor } from "@testing-library/react";
import { useData } from "@/hooks/use-data";
import { useConvex } from "convex/react";

// Mock convex
jest.mock("convex/react", () => ({
  useConvex: jest.fn(),
}));

describe("useData Hook", () => {
  const mockQuery = jest.fn();
  const mockConvex = {
    query: mockQuery,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useConvex as jest.Mock).mockReturnValue(mockConvex);
  });

  it("should initialize with loading state", async () => {
    mockQuery.mockResolvedValueOnce({ success: true });
    
    const { result } = renderHook(() => useData("test:query", {}));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual({ success: true });
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Network error");
    mockQuery.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useData("test:query", {}));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it("should support refresh", async () => {
    mockQuery.mockResolvedValueOnce({ count: 1 });
    
    const { result } = renderHook(() => useData("test:query", {}));

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 1 });
    });

    mockQuery.mockResolvedValueOnce({ count: 2 });
    
    act(() => {
      result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(true);

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.data).toEqual({ count: 2 });
  });
});
