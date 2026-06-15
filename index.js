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
  res.json({ message: "API Orion Group - com leads e admin" });
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

app.post("/leads", async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;
  if (!nome || !email) return res.status(400).json({ error: "Nome e email obrigatórios" });
  try {
    const result = await client.query(
      `INSERT INTO leads (nome, email, telefone, mensagem, status) 
       VALUES ($1, $2, $3, $4, 'novo') RETURNING *`,
      [nome, email, telefone || null, mensagem || null]
    );
    res.status(201).json({ success: true, lead: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar lead" });
  }
});

// ENDPOINT ADMIN: listar leads (protegido por senha)
app.get("/admin/leads", async (req, res) => {
  const senha = req.query.senha;
  const senhaCorreta = process.env.ADMIN_PASS;
  if (!senha || senha !== senhaCorreta) {
    return res.status(401).json({ error: "Acesso não autorizado" });
  }
  try {
    const result = await client.query("SELECT * FROM leads ORDER BY criado_em DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar leads" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
