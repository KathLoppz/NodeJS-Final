const express = require('express');
const mysql = require("mysql2");
const app = express();

const bd = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "hospitalizacion_db"
});

bd.connect(err => {
    if (err) {
        console.error("Error detectado: ", err);
        process.exit(1);
    }
    console.log("Conectado a BD");
});

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//  DASHBOARD

app.get("/", (req, res) => {
    res.render("dashboard");
});

//  PACIENTES

app.get("/pacientes", (req, res) => {
    bd.query(
        `SELECT p.*, t.nombre AS tipo_diagnostico 
         FROM paciente p
         JOIN tipo_diagnostico t ON p.tipo_diagnostico_id = t.id`,
        (err, datos) => {
            if (err) return res.status(500).send("Error en SQL");
            bd.query("SELECT * FROM tipo_diagnostico", (err2, tipos) => {
                res.render("pacientes/index", { pacientes: datos, tipos: tipos });  // ← aquí debe estar "tipos"
            });
        }
    );
});

app.post("/pacientes/crear", (req, res) => {
    const { nombre, apellido, tipo_diagnostico_id } = req.body;
    bd.query(
        "INSERT INTO paciente (nombre, apellido, tipo_diagnostico_id) VALUES (?, ?, ?)",
        [nombre, apellido, tipo_diagnostico_id],
        (err) => {
            if (err) return res.status(500).send("Error al crear paciente");
            res.redirect("/pacientes");
        }
    );
});

app.get("/pacientes/modificar/:id", (req, res) => {
    const id = req.params.id;
    bd.query(
        `SELECT p.*, t.nombre AS tipo_diagnostico 
         FROM paciente p
         JOIN tipo_diagnostico t ON p.tipo_diagnostico_id = t.id
         WHERE p.id=?`,
        [id],
        (err, datos) => {
            if (err) return res.status(500).send("Error al buscar paciente");
            bd.query("SELECT * FROM tipo_diagnostico", (err2, tipos) => {
                res.render("pacientes/modificar", { paciente: datos[0], tipos: tipos });
            });
        }
    );
});

app.post("/pacientes/modificar/:id", (req, res) => {
    const id = req.params.id;
    const { nombre, apellido, tipo_diagnostico_id } = req.body;
    bd.query(
        "UPDATE paciente SET nombre=?, apellido=?, tipo_diagnostico_id=? WHERE id=?",
        [nombre, apellido, tipo_diagnostico_id, id],
        (err) => {
            if (err) return res.status(500).send("Error al actualizar paciente");
            res.redirect("/pacientes");
        }
    );
});

app.get("/pacientes/eliminar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("DELETE FROM paciente WHERE id=?", [id], (err) => {
        if (err) return res.status(500).send("Error al eliminar paciente");
        res.redirect("/pacientes");
    });
});

//  HOSPITALIZACIONES

app.get("/hospitalizaciones", (req, res) => {
    bd.query(
        `SELECT h.*, p.nombre, p.apellido, s.nombre AS sala
         FROM hospitalizacion h
         JOIN paciente p ON h.paciente_id = p.id
         JOIN sala s ON h.sala_id = s.id`,
        (err, datos) => {
            if (err) return res.status(500).send("Error en SQL");
            bd.query("SELECT * FROM paciente", (err2, pacientes) => {
                bd.query("SELECT * FROM sala", (err3, salas) => {
                    res.render("hospitalizaciones/index", {
                        hospitalizaciones: datos,
                        pacientes: pacientes,
                        salas: salas
                    });
                });
            });
        }
    );
});

app.post("/hospitalizaciones/crear", (req, res) => {
    const { paciente_id, fecha_ingreso, fecha_alta, sala_id } = req.body;
    bd.query(
        "INSERT INTO hospitalizacion (paciente_id, fecha_ingreso, fecha_alta, sala_id) VALUES (?, ?, ?, ?)",
        [paciente_id, fecha_ingreso, fecha_alta || null, sala_id],
        (err) => {
            if (err) return res.status(500).send("Error al crear hospitalización");
            res.redirect("/hospitalizaciones");
        }
    );
});

app.get("/hospitalizaciones/modificar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("SELECT * FROM hospitalizacion WHERE id=?", [id], (err, datos) => {
        if (err) return res.status(500).send("Error al buscar hospitalización");
        bd.query("SELECT * FROM paciente", (err2, pacientes) => {
            bd.query("SELECT * FROM sala", (err3, salas) => {
                res.render("hospitalizaciones/modificar", {
                    hospitalizacion: datos[0],
                    pacientes: pacientes,
                    salas: salas
                });
            });
        });
    });
});

app.post("/hospitalizaciones/modificar/:id", (req, res) => {
    const id = req.params.id;
    const { paciente_id, fecha_ingreso, fecha_alta, sala_id } = req.body;
    bd.query(
        "UPDATE hospitalizacion SET paciente_id=?, fecha_ingreso=?, fecha_alta=?, sala_id=? WHERE id=?",
        [paciente_id, fecha_ingreso, fecha_alta || null, sala_id, id],
        (err) => {
            if (err) return res.status(500).send("Error al actualizar hospitalización");
            res.redirect("/hospitalizaciones");
        }
    );
});

app.get("/hospitalizaciones/eliminar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("DELETE FROM hospitalizacion WHERE id=?", [id], (err) => {
        if (err) return res.status(500).send("Error al eliminar hospitalización");
        res.redirect("/hospitalizaciones");
    });
});

//  PARAMETRICAS 

//  SALAS
app.get("/salas", (req, res) => {
    bd.query("SELECT * FROM sala", (err, datos) => {
        if (err) return res.status(500).send("Error en SQL");
        res.render("salas/index", { salas: datos });
    });
});

app.post("/salas/crear", (req, res) => {
    const { nombre, capacidad } = req.body;
    bd.query(
        "INSERT INTO sala (nombre, capacidad) VALUES (?, ?)",
        [nombre, capacidad],
        (err) => {
            if (err) return res.status(500).send("Error al crear sala");
            res.redirect("/salas");
        }
    );
});

app.get("/salas/modificar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("SELECT * FROM sala WHERE id=?", [id], (err, datos) => {
        if (err) return res.status(500).send("Error al buscar sala");
        res.render("salas/modificar", { sala: datos[0] });
    });
});

app.post("/salas/modificar/:id", (req, res) => {
    const id = req.params.id;
    const { nombre, capacidad } = req.body;
    bd.query(
        "UPDATE sala SET nombre=?, capacidad=? WHERE id=?",
        [nombre, capacidad, id],
        (err) => {
            if (err) return res.status(500).send("Error al actualizar sala");
            res.redirect("/salas");
        }
    );
});

app.get("/salas/eliminar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("DELETE FROM sala WHERE id=?", [id], (err) => {
        if (err) return res.status(500).send("Error al eliminar sala");
        res.redirect("/salas");
    });
});

//  TIPOS DIAGNÓSTICO 

app.get("/tipos-diagnostico", (req, res) => {
    bd.query("SELECT * FROM tipo_diagnostico", (err, datos) => {
        if (err) return res.status(500).send("Error en SQL");
        res.render("tipos/index", { tipos: datos });
    });
});

app.post("/tipos-diagnostico/crear", (req, res) => {
    const { nombre } = req.body;
    bd.query(
        "INSERT INTO tipo_diagnostico (nombre) VALUES (?)",
        [nombre],
        (err) => {
            if (err) return res.status(500).send("Error al crear tipo");
            res.redirect("/tipos-diagnostico");
        }
    );
});

app.get("/tipos-diagnostico/modificar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("SELECT * FROM tipo_diagnostico WHERE id=?", [id], (err, datos) => {
        if (err) return res.status(500).send("Error al buscar tipo");
        res.render("tipos/modificar", { tipo: datos[0] });
    });
});

app.post("/tipos-diagnostico/modificar/:id", (req, res) => {
    const id = req.params.id;
    const { nombre } = req.body;
    bd.query(
        "UPDATE tipo_diagnostico SET nombre=? WHERE id=?",
        [nombre, id],
        (err) => {
            if (err) return res.status(500).send("Error al actualizar tipo");
            res.redirect("/tipos-diagnostico");
        }
    );
});

app.get("/tipos-diagnostico/eliminar/:id", (req, res) => {
    const id = req.params.id;
    bd.query("DELETE FROM tipo_diagnostico WHERE id=?", [id], (err) => {
        if (err) return res.status(500).send("Error al eliminar tipo");
        res.redirect("/tipos-diagnostico");
    });
});

//  CONSULTAS

app.get("/consulta-disponibilidad", (req, res) => {
    bd.query(
        `SELECT s.nombre AS sala, s.capacidad,
                COUNT(h.id) AS ocupados,
                (s.capacidad - COUNT(h.id)) AS disponibles
         FROM sala s
         LEFT JOIN hospitalizacion h 
                ON h.sala_id = s.id AND h.fecha_alta IS NULL
         GROUP BY s.id`,
        (err, datos) => {
            if (err) return res.status(500).send("Error en consulta");
            res.render("consultas/disponibilidad", { lista: datos });
        }
    );
});

app.get("/consulta-buscar", (req, res) => {
    const nombre = req.query.nombre || "";
    bd.query(
        `SELECT p.id, p.nombre, p.apellido, t.nombre AS diagnostico,
                h.fecha_ingreso, h.fecha_alta, s.nombre AS sala
         FROM paciente p
         JOIN tipo_diagnostico t ON p.tipo_diagnostico_id = t.id
         LEFT JOIN hospitalizacion h ON h.paciente_id = p.id
         LEFT JOIN sala s ON h.sala_id = s.id
         WHERE p.nombre LIKE ? OR p.apellido LIKE ?`,
        [`%${nombre}%`, `%${nombre}%`],
        (err, datos) => {
            if (err) return res.status(500).send("Error en consulta");
            res.render("consultas/buscar", { lista: datos, busqueda: nombre });
        }
    );
});


app.listen(3000, () => console.log("Servidor en http://localhost:3000"));