const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post("/scan", async (req, res) => {
  const { id: userId } = req.body;

  try {
    const users = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (users.rows.length === 0) {
      res.status(404).json({ message: "User not found!" });
      return;
    }

    const user = users.rows[0];

    if (user.scanned) {
      res.status(400).json({ message: "User already scanned!" });
      return;
    }

    const result = await pool.query(
      "UPDATE users SET scanned = true WHERE id = $1 RETURNING *",
      [userId]
    );

    res.status(200).json({
      message: "QR Code processed successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/generate", async (req, res) => {
  const { id: userId } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (user.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await QRCode.toFile(
      `user-${userId}-qrcode.png`,
      JSON.stringify(user.rows[0]),
      {
        width: 300,
      }
    );

    const qrBuffer = QRCode.toBuffer(JSON.stringify(user.rows[0]));

    res.set("Content-Type", "image/png");
    res.status(200).send(qrBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(443, () => {
  console.log(`Server running on port 443`);
});
