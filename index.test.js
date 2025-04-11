const request = require("supertest");
const express = require("express");
const { app, server } = require("./index"); // Adjust the path according to your project structure

describe("Leaderboard API Endpoints", () => {
  test("GET / should return API description", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toContain("Leaderboard API");
  });

  test("GET /api/sheet should return leaderboard data", async () => {
    const response = await request(app).get("/api/sheet");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("common");
    expect(response.body).toHaveProperty("l1");
    expect(response.body).toHaveProperty("l2");
  });

  test("GET /api/questions should return questions data", async () => {
    const response = await request(app).get("/api/questions");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /clearcache should clear the cache", async () => {
    const response = await request(app).get("/clearcache");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Cache cleared successfully");
  });

  test("GET /getAcmCard/:name should return ACM card data", async () => {
    const response = await request(app).get("/getAcmCard/240598");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.file).toHaveProperty("name");
    expect(response.body.file).toHaveProperty("downloadLink");
    expect(response.body.file).toHaveProperty("imageSrc");
    expect(response.body.file).toHaveProperty("viewLink");
  });
});

afterAll(() => {
  server.close();
});
