require("dotenv").config();
const express = require("express");
const { Client } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect();

app.get("/", (req, res) => {
  res.json({ message: "API rodando!" });
});

app.get("/usuarios", async (req, res) => {
  const result = await client.query("SELECT * FROM usuarios ORDER BY id");
  res.json(result.rows);
});

app.post("/usuarios", async (req, res) => {
  const { nome, idade } = req.body;
  if (!nome || !idade) return res.status(400).json({ error: "Nome e idade obrigatórios" });
  const result = await client.query(
    "INSERT INTO usuarios (nome, idade) VALUES ($1, $2) RETURNING *",
    [nome, idade]
  );
  res.status(201).json(result.rows[0]);
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
