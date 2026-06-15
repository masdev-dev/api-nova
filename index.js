require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors()); // Permite qualquer origem – OK para desenvolvimento/projeto próprio
app.use(express.json());

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect();

// Rota raiz
app.get("/", (req, res) => {
  res.json({ message: "API Orion Group - com leads e CORS" });
});

// (Opcional) endpoint /usuarios – pode ser removido depois
app.get("/usuarios", async (req, res) => {
  const result = await client.query("SELECT * FROM usuarios ORDER BY id");
  res.json(result.rows);
});

// Endpoint de leads (usado pelo formulário)
app.post("/leads", async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ error: "Nome e email são obrigatórios" });
  }
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

// Endpoint administrativo (protegido por senha)
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port} com CORS ativado`);
});
