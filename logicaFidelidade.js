const REGRAS = {
    PONTUACAO: {
        TAXA_NORMAL: 1,
        TAXA_GOLD: 1.5,
    },
    TIERS: {
        SILVER: { nome: 'silver', meta: 0 },
        GOLD: { nome: 'gold', meta: 1000 },
    },
    VALIDADE_PONTOS_DIAS: 365,
};

const validarEntradaCompra = (input) => {
    if (input === undefined || input === null) {
        return { success: false, value: 0, message: "Valor inválido." };
    }
    const valorLimpo = String(input).trim().replace(',', '.');
    const valorNum = parseFloat(valorLimpo);
    if (isNaN(valorNum)) {
        return { success: false, value: 0, message: "Valor inválido. Por favor, insira um número." };
    }
    if (valorNum <= 0) {
        return { success: false, value: 0, message: "O valor da compra deve ser positivo." };
    }
    return { success: true, value: valorNum, message: "" };
};
const validarEntradaTroca = (produto, pontos) => {
    const produtoLimpo = produto.trim();
    if (produtoLimpo.length < 3) {
        return { success: false, produto: "", pontos: 0, message: "Nome do produto/serviço inválido." };
    }
    const pontosNum = parseInt(pontos, 10);
    if (isNaN(pontosNum) || pontosNum <= 0) {
        return { success: false, produto: "", pontos: 0, message: "Pontos necessários devem ser um número positivo." };
    }
    return { success: true, produto: produtoLimpo, pontos: pontosNum, message: "" };
};

const calcularPontos = (valorCompra, tier) => {
    const taxa = (tier === REGRAS.TIERS.GOLD.nome) ? REGRAS.PONTUACAO.TAXA_GOLD : REGRAS.PONTUACAO.TAXA_NORMAL;
    return Math.floor(valorCompra * taxa);
};

/**
 * @param {Array} historicoAtual
 * @param {number} pontos 
 * @param {Date} data
 * @param {string} tipo 
 * @param {string} descricao 
 * @returns {Array} 
 */
const adicionarEntradaNoHistorico = (historicoAtual, pontos, data, tipo = 'Ganho', descricao = '') => {
    const dataExpiracao = (pontos > 0) ? new Date(data.getTime()) : null;
    if (dataExpiracao) {
        dataExpiracao.setDate(dataExpiracao.getDate() + REGRAS.VALIDADE_PONTOS_DIAS);
    }
    const novaEntrada = {
        id: Date.now(),
        pontos: pontos,
        tipo: tipo,
        descricao: descricao,
        dataEntrada: data,
        dataExpiracao: dataExpiracao,
        expirado: false,
    };
    return [...historicoAtual, novaEntrada];
};

const calcularSaldoTotal = (historicoPontos) => {

    const totalBruto = historicoPontos.reduce((total, entrada) => {
        if (entrada.tipo === 'Troca') {
            return total + entrada.pontos;
        }
        return total + (entrada.expirado ? 0 : entrada.pontos);
    }, 0);
    return Math.max(0, totalBruto);
};

const verificarExpiracao = (historicoAtual, dataVerificacao) => {

    return historicoAtual.map(entrada => {
        if (entrada.tipo !== 'Ganho' || !entrada.dataExpiracao) {
            return entrada;
        }
        const estaExpirado = dataVerificacao > entrada.dataExpiracao;
        if (estaExpirado === entrada.expirado) {
            return entrada;
        }
        return { ...entrada, expirado: estaExpirado };
    });
};

const atualizarTier = (saldoPontos, tierAtual) => {

    if (saldoPontos >= REGRAS.TIERS.GOLD.meta) {
        return REGRAS.TIERS.GOLD.nome;
    }
    if (tierAtual === REGRAS.TIERS.GOLD.nome && saldoPontos < REGRAS.TIERS.GOLD.meta) {
        return REGRAS.TIERS.SILVER.nome;
    }
    return tierAtual;
};
const processarCompra = (estadoAtual, valorCompra, dataCompra) => {
    const pontosGanhos = calcularPontos(valorCompra, estadoAtual.tier);
    const novoHistorico = adicionarEntradaNoHistorico(
        estadoAtual.historicoPontos,
        pontosGanhos,
        dataCompra,
        'Ganho',
        `Compra de R$ ${valorCompra.toFixed(2)}` 
    );
    const novoSaldo = calcularSaldoTotal(novoHistorico);
    const novoTier = atualizarTier(novoSaldo, estadoAtual.tier);
    
    return {
        ...estadoAtual,
        tier: novoTier,
        pontos: novoSaldo,
        historicoPontos: novoHistorico,
    };
};

const processarTroca = (estadoAtual, produto, pontosNecessarios) => {

    const saldoAtualCalculado = calcularSaldoTotal(estadoAtual.historicoPontos);
    if (saldoAtualCalculado < pontosNecessarios) {
        return { novoEstado: estadoAtual, erro: "Pontos insuficientes para esta troca." };
    }
    const novoHistorico = adicionarEntradaNoHistorico(
        estadoAtual.historicoPontos,
        -pontosNecessarios,
        new Date(),
        'Troca',
        produto 
    );
    const novoSaldo = calcularSaldoTotal(novoHistorico);
    const novoTier = atualizarTier(novoSaldo, estadoAtual.tier);
    const novoEstado = {
        ...estadoAtual,
        tier: novoTier,
        pontos: novoSaldo,
        historicoPontos: novoHistorico,
    };
    return { novoEstado: novoEstado, erro: null };
};

const processarExpiracao = (estadoAtual, dataVerificacao) => {
    const historicoVerificado = verificarExpiracao(
        estadoAtual.historicoPontos,
        dataVerificacao
    );
    const novoSaldo = calcularSaldoTotal(historicoVerificado);
    const novoTier = atualizarTier(novoSaldo, estadoAtual.tier);
    
    return {
        ...estadoAtual,
        tier: novoTier,
        pontos: novoSaldo,
        historicoPontos: historicoVerificado,
    };
};

module.exports = {
    REGRAS,
    validarEntradaCompra,
    validarEntradaTroca,
    processarCompra,
    processarTroca,
    processarExpiracao
};