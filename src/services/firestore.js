// Funções do Firestore para gerenciamento de dados
// Em modo demo, estas funções simulam operações do Firebase

export async function salvarDadosCaixa(numeroCaixa, dados) {
  // Em produção, salvaria no Firestore
  console.log(`Salvando dados do Caixa ${numeroCaixa}:`, dados)
  return Promise.resolve(dados)
}

export async function buscarDadosCaixa(numeroCaixa, data) {
  // Em produção, buscaria do Firestore
  console.log(`Buscando dados do Caixa ${numeroCaixa} para ${data}`)
  return Promise.resolve({
    saldoInicial: 0,
    valorMaquina: null,
    observacoes: '',
    data
  })
}

export async function adicionarMovimentacao(numeroCaixa, movimentacao) {
  // Em produção, adicionaria no Firestore
  console.log(`Adicionando movimentação no Caixa ${numeroCaixa}:`, movimentacao)
  return Promise.resolve(movimentacao)
}

export async function buscarMovimentacoesDia(numeroCaixa, data) {
  // Em produção, buscaria do Firestore
  console.log(`Buscando movimentações do Caixa ${numeroCaixa} para ${data}`)
  return Promise.resolve([])
}

export function calcularSaldoFinal(saldoInicial, suprimentos, sangrias) {
  return saldoInicial + suprimentos - sangrias
}

// Função para escutar mudanças em tempo real (em produção usaria onSnapshot)
export function escutarMudancasCaixa(numeroCaixa, callback) {
  console.log(`Escutando mudanças do Caixa ${numeroCaixa}`)
  // Em produção, retornaria uma função de unsubscribe
  return () => console.log(`Parando de escutar Caixa ${numeroCaixa}`)
}

