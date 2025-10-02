import React, { useState } from "react";

export default function Register({ toggleMode }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: "user" }),
      });

      if (res.ok) {
        setSuccess("Usuário criado com sucesso!");
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        const data = await res.json();
        setError(data.detail || "Erro ao criar usuário");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg items-center w-96 max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Cadastro</h2>
        <form onSubmit={handleSubmit} className="flex-col w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input
              type="text"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-base"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-lg flex justify-center items-center gap-2"
          >
            {loading && <span className="loader-border animate-spin border-white rounded-full w-5 h-5"></span>}
            {loading ? "Processando..." : "Cadastrar"}
          </button>
          {success && <p className="text-green-600 text-center mt-2">{success}</p>}
          {error && <p className="text-red-600 text-center mt-2">{error}</p>}
        </form>

        <p className="text-center text-gray-500">
          Já tem conta?{" "}
          <button onClick={toggleMode} className="text-indigo-600 font-semibold hover:underline transition">
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
}
