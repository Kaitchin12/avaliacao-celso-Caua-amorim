const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const path = require("path");

const app = express();

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Conexão MySQL
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Amorim#2210",
    database: "taskflow"
});

connection.connect((err) => {
    if (err) {
        console.log("Erro ao conectar no banco:", err.message);
        return;
    }
    console.log("Banco conectado com sucesso!");
});

// Arquivos públicos
app.use(express.static(path.join(__dirname, "../public")));

// ===========================
//   1. CADASTRAR TAREFA
// ===========================
app.post("/tasks", (req, res) => {
    const { titulo, data_prevista } = req.body;

    const sql = "INSERT INTO tarefas (titulo, data_prevista, status) VALUES (?, ?, 'pendente')";

    connection.query(sql, [titulo, data_prevista], (err) => {
        if (err) {
            console.error("Erro ao cadastrar tarefa:", err.message);
            return res.status(500).send("Erro ao salvar no banco.");
        }

        res.send("Tarefa cadastrada com sucesso!");
    });
});

// ===========================
//   2. LISTAR TAREFAS
// ===========================
app.get("/tasks", (req, res) => {
    const orderBy = req.query.orderBy === "data-desc" ? "DESC" : "ASC";

    const sql = `
        SELECT * FROM tarefas
        ORDER BY 
            FIELD(status, 'pendente', 'concluida'),
            data_prevista ${orderBy}
    `;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao listar tarefas:", err.message);
            return res.status(500).send("Erro ao buscar dados.");
        }

        res.json(results);
    });
});

// ===========================
//   3. EDITAR TAREFA (FALTAVA)
// ===========================
app.put("/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { titulo, data_prevista } = req.body;

    if (!titulo || !data_prevista) {
        return res.status(400).send("Título e data prevista são obrigatórios.");
    }

    const sql = `
        UPDATE tarefas 
        SET titulo = ?, data_prevista = ?
        WHERE id = ?
    `;

    connection.query(sql, [titulo, data_prevista, id], (err) => {
        if (err) {
            console.error("Erro ao editar tarefa:", err.message);
            return res.status(500).send("Erro ao editar.");
        }

        res.send("Tarefa editada com sucesso!");
    });
});

// ===========================
//   4. MARCAR COMO CONCLUÍDA
// ===========================
app.put("/tasks/:id/done", (req, res) => {
    const { id } = req.params;

    const sql = "UPDATE tarefas SET status='concluida' WHERE id=?";

    connection.query(sql, [id], (err) => {
        if (err) {
            console.error("Erro ao concluir:", err.message);
            return res.status(500).send("Erro ao atualizar.");
        }

        res.send("Tarefa marcada como concluída.");
    });
});

// ===========================
//   5. EXCLUIR TAREFA
// ===========================
app.delete("/tasks/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM tarefas WHERE id=?";

    connection.query(sql, [id], (err) => {
        if (err) {
            console.error("Erro ao excluir:", err.message);
            return res.status(500).send("Erro ao excluir.");
        }

        res.send("Tarefa excluída com sucesso.");
    });
});

// Iniciar servidor
app.listen(2009, () =>
    console.log("Servidor rodando em http://localhost:2009")
);
