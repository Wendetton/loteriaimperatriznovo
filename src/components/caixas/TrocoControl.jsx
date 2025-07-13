// src/components/caixas/TrocoControl.jsx
import { useState, useEffect } from "react";
import {
  abrirTroco,
  ajustarTroco,
  fecharTroco,
  getTrocoAtivo
} from "../../services/trocoService";

export default function TrocoControl({ caixaId }) {
  const [troco, setTroco] = useState(null);
  const [valorInicial, setValorInicial] = useState("");
  const [ajuste, setAjuste] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    fetchTroco();
  }, []);

  async function fetchTroco() {
    const data = await getTrocoAtivo(caixaId);
    setTroco(data);
  }

  async function handleAbrir(e) {
    e.preventDefault();
    await abrirTroco(caixaId, valorInicial);
    setValorInicial("");
    fetchTroco();
  }

  async function handleAjustar(e) {
    e.preventDefault();
    await ajustarTroco(troco.id, ajuste, motivo);
    setAjuste("");
    setMotivo("");
    fetchTroco();
  }

  async function handleFechar() {
    await fecharTroco(troco.id);
    setTroco(null);
  }

  if (!troco) {
    return (
      <form onSubmit={handleAbrir} className="space-y-2">
        <label className="block">Troco Inicial (R$):</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={valorInicial}
          onChange={e => setValorInicial(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Abrir Caixa
        </button>
      </form>
    );
  }

  const saldoAtual = (
    troco.valorInicial +
    (troco.valorAjuste || 0)
  ).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded shadow">
        <p>Troco Inicial: R$ {troco.valorInicial.toFixed(2)}</p>
        <p>Ajustes: R$ {troco.valorAjuste.toFixed(2)}</p>
        <p className="font-bold">Saldo Atual: R$ {saldoAtual}</p>
      </div>

      <form onSubmit={handleAjustar} className="space-y-2">
        <label>Valor de Ajuste (±):</label>
        <input
          type="number"
          step="0.01"
          value={ajuste}
          onChange={e => setAjuste(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <label>Motivo:</label>
        <input
          type="text"
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Registrar Ajuste
        </button>
      </form>

      <button
        onClick={handleFechar}
        className="bg-red-600 text-white px-4 py-2 rounded mt-2"
      >
        Fechar Caixa
      </button>
    </div>
  );
}
