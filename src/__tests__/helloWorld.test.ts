describe("Hello World Tests", () => {
  it("should pass a basic sanity test", () => {
    expect(true).toBe(true);
  });

  it("should perform basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });

  it("should handle string comparison", () => {
    const greeting = "Hello, World!";
    expect(greeting).toContain("World");
  });
});
