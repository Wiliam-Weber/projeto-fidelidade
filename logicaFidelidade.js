
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


/**
 * @param {string} input 
 * @returns {{success: boolean, value: number, message: string}}
 */
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


/**
 * @param {number} valorCompra
 * @param {string} tier
 * @returns {number}
 */
const calcularPontos = (valorCompra, tier) => {
    const taxa = (tier === REGRAS.TIERS.GOLD.nome)
        ? REGRAS.PONTUACAO.TAXA_GOLD
        : REGRAS.PONTUACAO.TAXA_NORMAL;
    return Math.floor(valorCompra * taxa);
};

/**
 * @param {Array} historicoAtual
 * @param {number} pontosGanhos
 * @param {Date} dataCompra
 * @returns {Array} 
 */
const adicionarEntradaNoHistorico = (historicoAtual, pontosGanhos, dataCompra) => {
    const dataExpiracao = new Date(dataCompra.getTime());
    dataExpiracao.setDate(dataExpiracao.getDate() + REGRAS.VALIDADE_PONTOS_DIAS);

    const novaEntrada = {
        id: Date.now(),
        pontos: pontosGanhos,
        dataEntrada: dataCompra,
        dataExpiracao: dataExpiracao,
        expirado: false,
    };
    
    return [...historicoAtual, novaEntrada];
};

/**
 * @param {Array} historicoPontos
 * @returns {number}
 */
const calcularSaldoTotal = (historicoPontos) => {
    return historicoPontos.reduce((total, entrada) => {
        return total + (entrada.expirado ? 0 : entrada.pontos);
    }, 0);
};

/**
 * @param {Array} historicoAtual
 * @param {Date} dataVerificacao
 * @returns {Array} 
 */
const verificarExpiracao = (historicoAtual, dataVerificacao) => {
 
    return historicoAtual.map(entrada => {
        const estaExpirado = dataVerificacao > entrada.dataExpiracao;

        if (estaExpirado === entrada.expirado) {
            return entrada;
        }
        
        return {
            ...entrada,
            expirado: estaExpirado,
        };
    });
};

/**

 * @param {number} saldoPontos
 * @param {string} tierAtual
 * @returns {string} 
 */
const atualizarTier = (saldoPontos, tierAtual) => {

    if (saldoPontos >= REGRAS.TIERS.GOLD.meta) {
        return REGRAS.TIERS.GOLD.nome;
    }
    if (tierAtual === REGRAS.TIERS.GOLD.nome && saldoPontos < REGRAS.TIERS.GOLD.meta) {
        return REGRAS.TIERS.SILVER.nome;
    }
    return tierAtual;
};


/**
 * @param {object} estadoAtual
 * @param {number} valorCompra
 * @param {Date} dataCompra
 * @returns {object} 
 */
const processarCompra = (estadoAtual, valorCompra, dataCompra) => {
    const pontosGanhos = calcularPontos(valorCompra, estadoAtual.tier);
    const novoHistorico = adicionarEntradaNoHistorico(
        estadoAtual.historicoPontos,
        pontosGanhos,
        dataCompra
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

/**

 * @param {object} estadoAtual
 * @param {Date} dataVerificacao
 * @returns {object} 
 */
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
    processarCompra,
    processarExpiracao
}